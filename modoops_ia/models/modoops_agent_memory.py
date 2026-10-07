from odoo import api, fields, models, _
from odoo.exceptions import ValidationError

from ..logic import memory as mem_logic


class ModoopsAgentMemory(models.Model):
    _name = "modoops.agent.memory"
    _description = "Memoria del Agente — solo en Tenant, cifrada, purgable"
    _order = "write_date desc"

    tenant_db = fields.Char(required=True, index=True, default=lambda self: self.env.context.get("tenant_db") or "")
    key = fields.Char(required=True, index=True)
    value_encrypted = fields.Text(required=True, help="Valor cifrado Fernet — nunca en logs")
    valid_until = fields.Date(
        help="Purgable; default 90d",
        default=lambda self: fields.Date.add(fields.Date.context_today(self), days=mem_logic.RETENTION_DAYS),
    )

    _sql_constraints = [("key_tenant_unique", "unique(tenant_db, key)", "Memoria duplicada por Tenant")]

    @api.model
    def _memory_key(self) -> str:
        """Key Fernet por DB; auto-generada si falta (acordado: operativa sin paso manual)."""
        ICP = self.env["ir.config_parameter"].sudo()
        key = ICP.get_param(mem_logic.MEMORY_KEY_PARAM, "") or ""
        if not key:
            key = mem_logic.make_key()
            ICP.set_param(mem_logic.MEMORY_KEY_PARAM, key)
        return key

    @api.model
    def _check_tenant_db(self, tenant_db: str) -> str:
        """El tenant_db del caller debe ser la DB en curso (anti cross-tenant)."""
        if not tenant_db:
            return self.env.cr.dbname
        if tenant_db != self.env.cr.dbname:
            raise ValidationError(_("Memoria de otro Tenant: operación denegada"))
        return tenant_db

    @api.model
    def memo_set(self, tenant_db: str, key: str, value: str, valid_days: int = mem_logic.RETENTION_DAYS):
        tenant_db = self._check_tenant_db(tenant_db)
        row = self.search([("tenant_db", "=", tenant_db), ("key", "=", key)], limit=1)
        vals = {
            "tenant_db": tenant_db,
            "key": key,
            "value_encrypted": mem_logic.encrypt_value(value, self._memory_key()),
            "valid_until": fields.Date.add(fields.Date.context_today(self), days=mem_logic.clamp_valid_days(valid_days)),
        }
        if row:
            row.write(vals)
            return row
        return self.create(vals)

    @api.model
    def memo_get(self, tenant_db: str, key: str):
        tenant_db = self._check_tenant_db(tenant_db)
        row = self.search([("tenant_db", "=", tenant_db), ("key", "=", key)], limit=1)
        if not row:
            return None
        value = mem_logic.decrypt_maybe_legacy(row.value_encrypted, self._memory_key())
        if not mem_logic.looks_fernet(row.value_encrypted):
            row.value_encrypted = mem_logic.encrypt_value(value, self._memory_key())
        return value

    @api.model
    def purge_expired(self):
        expired = self.search([("valid_until", "!=", False), ("valid_until", "<", fields.Date.context_today(self))])
        expired.unlink()
        return len(expired)
