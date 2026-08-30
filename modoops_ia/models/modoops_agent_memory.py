from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class ModoopsAgentMemory(models.Model):
    _name = "modoops.agent.memory"
    _description = "Memoria del Agente — solo en Tenant, cifrada, purgable"
    _order = "write_date desc"

    tenant_db = fields.Char(required=True, index=True, default=lambda self: self.env.context.get("tenant_db") or "")
    key = fields.Char(required=True, index=True)
    value_encrypted = fields.Text(required=True, help="Valor cifrado (pgcrypto/fernet) — nunca en logs")
    valid_until = fields.Date(help="Purgable; default 90d")

    _sql_constraints = [("key_tenant_unique", "unique(tenant_db, key)", "Memoria duplicada por Tenant")]

    @api.model
    def purge_expired(self):
        expired = self.search([("valid_until", "!=", False), ("valid_until", "<", fields.Date.context_today(self))])
        expired.unlink()
        return len(expired)
