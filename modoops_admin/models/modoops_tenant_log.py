from odoo import fields, models


class ModoopsTenantLog(models.Model):
    _name = "modoops.tenant.log"
    _description = "Log Control Plane por Tenant"
    _order = "create_date desc, id desc"

    tenant_id = fields.Many2one("modoops.tenant", string="Tenant", required=True, ondelete="cascade", index=True)
    action = fields.Selection(
        [
            ("creado", "Creado"),
            ("install", "Instalar módulo"),
            ("remove", "Quitar módulo"),
            ("suspendido", "Suspendido"),
            ("reactivado", "Reactivado"),
            ("baja", "Baja"),
            ("backup", "Backup"),
            ("aviso", "Aviso mora"),
        ],
        required=True,
    )
    detail = fields.Char(string="Detalle", help="Módulo, resultado, nota corta")
    user_id = fields.Many2one("res.users", string="Operador", default=lambda self: self.env.user, readonly=True)
