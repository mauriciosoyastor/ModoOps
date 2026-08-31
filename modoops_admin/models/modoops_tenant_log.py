import csv
import io
import base64

from odoo import api, fields, models


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

    @api.model
    def action_export_csv(self):
        """Exporta logs filtrados a CSV (seam modelo, testeable sin browser)."""
        # usa el contexto de búsqueda actual si viene de act_window; fallback a todos
        domain = self.env.context.get("log_export_domain") or []
        records = self.search(domain, order="create_date desc")
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(["create_date", "tenant_id", "action", "detail", "user_id"])
        for rec in records:
            writer.writerow(
                [
                    rec.create_date.isoformat() if rec.create_date else "",
                    rec.tenant_id.db_name if rec.tenant_id else "",
                    rec.action or "",
                    rec.detail or "",
                    rec.user_id.login if rec.user_id else "",
                ]
            )
        csv_bytes = output.getvalue().encode("utf-8")
        csv_b64 = base64.b64encode(csv_bytes).decode("ascii")
        # en Odoo real se crearía ir.attachment + act_url; para host test devolvemos b64
        return {"csv_b64": csv_b64, "count": len(records), "filename": "modoops_tenant_log.csv"}

    def to_csv_row(self):
        """Helper puro para fila CSV (testeable sin cursor)."""
        return [
            self.create_date.isoformat() if getattr(self, "create_date", None) else "",
            getattr(self.tenant_id, "db_name", "") if getattr(self, "tenant_id", None) else "",
            self.action or "",
            self.detail or "",
            getattr(self.user_id, "login", "") if getattr(self, "user_id", None) else "",
        ]
