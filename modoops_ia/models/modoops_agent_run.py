from odoo import api, fields, models, _
from odoo.exceptions import UserError


class ModoopsAgentRun(models.Model):
    _name = "modoops.agent.run"
    _description = "Ejecución (Corrida) del Agente — auditada, idempotente"
    _order = "create_date desc"

    request_id = fields.Char(required=True, index=True, help="UUID cliente para idempotencia")
    tenant_db = fields.Char(required=True, index=True, help="Contexto Tenant db_name")
    tenant_id = fields.Many2one("modoops.tenant", string="Tenant")
    tool_name = fields.Char(required=True, index=True)
    input_json = fields.Text()
    status = fields.Selection(
        [("ok", "OK"), ("needs_tool", "Falla cerrada"), ("needs_human", "Derivado"), ("error", "Error")],
        required=True,
        default="ok",
    )
    output_json = fields.Text()
    _sql_constraints = [
        ("request_tool_tenant_unique", "unique(request_id, tool_name, tenant_db)", "Corrida idempotente ya existe")
    ]

    @api.model
    def create_idempotent(self, vals: dict):
        existing = self.search(
            [("request_id", "=", vals.get("request_id")), ("tool_name", "=", vals.get("tool_name")), ("tenant_db", "=", vals.get("tenant_db"))],
            limit=1,
        )
        if existing:
            return existing
        return self.create(vals)
