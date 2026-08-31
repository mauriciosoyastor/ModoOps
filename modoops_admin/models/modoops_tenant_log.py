import csv
import io
import base64

from odoo import api, fields, models


class ModoopsTenantLog(models.Model):
    _name = "modoops.tenant.log"
    _description = "Log Control Plane por Tenant"
    _order = "create_date desc, id desc"

    tenant_id = fields.Many2one("modoops.tenant", string="Tenant", required=False, ondelete="cascade", index=True)
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
            ("configurador_generar", "Configurador — Generar Propuesta"),
        ],
        required=True,
    )
    detail = fields.Char(string="Detalle", help="Módulo, resultado, nota corta")
    hash = fields.Char(string="Hash entrada", help="SHA256 de input configurador")
    input_json = fields.Text(string="Input JSON", help="Input configurador serializado")
    user_id = fields.Many2one("res.users", string="Operador", default=lambda self: self.env.user, readonly=True)

    @api.model
    def action_export_csv(self):
        """Exporta logs filtrados a CSV (seam modelo, testeable sin browser)."""
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
        # crea ir.attachment para descarga + act_url (Odoo real)
        try:
            attachment = self.env["ir.attachment"].create(
                {
                    "name": "modoops_tenant_log.csv",
                    "type": "binary",
                    "datas": csv_b64,
                    "mimetype": "text/csv",
                }
            )
            return {
                "type": "ir.actions.act_url",
                "url": f"/web/content/{attachment.id}?download=true",
                "target": "self",
                "csv_b64": csv_b64,
                "count": len(records),
                "filename": "modoops_tenant_log.csv",
            }
        except Exception:
            # host test sin DB: fallback b64
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
