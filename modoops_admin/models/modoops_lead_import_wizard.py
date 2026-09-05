import base64
import json

from odoo import _, api, fields, models
from odoo.exceptions import UserError

from odoo.addons.modoops_admin.logic import lead_import as logic


class ModoopsLeadImportWizard(models.TransientModel):
    _name = "modoops.lead.import.wizard"
    _description = "Asistente para importar leads CSV en modo borrador"

    state = fields.Selection(
        [
            ("upload", "Subir"),
            ("preview", "Preview"),
            ("done", "Listo"),
        ],
        default="upload",
        required=True,
    )
    filename = fields.Char()
    file_data = fields.Binary(string="Archivo CSV")
    rows_json = fields.Text()
    discarded_text = fields.Text(readonly=True)
    line_ids = fields.One2many(
        "modoops.lead.import.line",
        "wizard_id",
        string="Filas",
    )
    created_count = fields.Integer(readonly=True)
    message = fields.Text(readonly=True)

    def action_parse_preview(self):
        self.ensure_one()
        if not self.file_data:
            raise UserError(_("Subí un archivo CSV con forma gosom."))
        raw = base64.b64decode(self.file_data)
        parsed = logic.parse_csv_bytes(raw)
        if parsed.get("error"):
            raise UserError(parsed["error"])
        mapped = logic.map_rows(parsed["rows"])
        Line = self.env["modoops.lead.import.line"]
        self.line_ids.unlink()
        vals_list = []
        for number, row in enumerate(mapped["mapped"], start=1):
            vals = logic.to_lead_vals(row)
            vals_list.append(
                {
                    "wizard_id": self.id,
                    "line_number": number,
                    "selected": True,
                    "nombre": vals.get("nombre") or False,
                    "telefono": vals.get("telefono") or False,
                    "email": vals.get("email") or False,
                    "web": vals.get("web") or False,
                    "categoria": vals.get("categoria") or False,
                    "estado": "nuevo",
                }
            )
        if vals_list:
            Line.create(vals_list)
        self.write(
            {
                "state": "preview",
                "rows_json": json.dumps(mapped["mapped"], ensure_ascii=False, default=str),
                "discarded_text": ", ".join(mapped["discarded"]) or _("Ninguna"),
                "message": False,
            }
        )
        return {
            "type": "ir.actions.act_window",
            "res_model": self._name,
            "res_id": self.id,
            "view_mode": "form",
            "target": "new",
        }

    def action_apply(self):
        self.ensure_one()
        lines = self.line_ids.filtered("selected")
        if not lines:
            raise UserError(_("No hay filas seleccionadas para importar."))
        Lead = self.env["modoops.lead"]
        count = 0
        for line in lines:
            Lead.create(
                {
                    "nombre": line.nombre,
                    "telefono": line.telefono or False,
                    "email": line.email or False,
                    "web": line.web or False,
                    "categoria": line.categoria or False,
                    "estado": "nuevo",
                }
            )
            count += 1
        self.env["modoops.tenant.log"].create(
            {
                "action": "creado",
                "detail": f"Import leads CSV: {count} (archivo {self.filename or '-'})",
            }
        )
        self.write({"state": "done", "created_count": count})
        return {
            "type": "ir.actions.act_window",
            "res_model": self._name,
            "res_id": self.id,
            "view_mode": "form",
            "target": "new",
        }


class ModoopsLeadImportLine(models.TransientModel):
    _name = "modoops.lead.import.line"
    _description = "Fila preview de import de leads"

    wizard_id = fields.Many2one("modoops.lead.import.wizard", required=True, ondelete="cascade")
    line_number = fields.Integer()
    selected = fields.Boolean(default=True)
    nombre = fields.Char()
    telefono = fields.Char()
    email = fields.Char()
    web = fields.Char()
    categoria = fields.Char()
    estado = fields.Char(default="nuevo")
