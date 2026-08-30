from odoo import fields, models


class ModoopsTenant(models.Model):
    _name = "modoops.tenant"
    _description = "Tenant ModoOps (cliente aislado Multi-DB)"

    name = fields.Char(string="Cliente", required=True, help="Nombre comercial, ej: Pinturería Centro")
    db_name = fields.Char(string="Base DB", required=True, help="modoops_<slug>, ej: modoops_pintureria_centro")
    slug = fields.Char(string="Slug", help="slug para db_name")
    vertical = fields.Selection(
        [("retail", "Retail"), ("servicios", "Servicios"), ("distribucion", "Distribución")],
        string="Vertical",
        default="retail",
    )
    state = fields.Selection(
        [("activo", "Activo"), ("suspendido", "Suspendido"), ("baja", "Baja")],
        string="Estado",
        default="activo",
    )
    abono_due_date = fields.Date(string="Vencimiento abono")
    modules_installed = fields.Text(string="Módulos instalados", help="Lista del Catálogo ModoOps, ej: Mostrador, Depósito, Fiscal AR")
    last_backup = fields.Datetime(string="Último backup")
    notes = fields.Text(string="Notas")

    def action_install_module(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_url",
            "url": f"/modoops/admin/install?tenant={self.db_name}",
            "target": "new",
        }

    def action_suspend(self):
        self.write({"state": "suspendido"})
        return True

    def action_reactivate(self):
        self.write({"state": "activo"})
        return True
