from odoo import api, fields, models, _
from odoo.exceptions import UserError

from .modoops_tenant import CATALOGO_MODOOPS, CATALOGO_DICT


class ModoopsTenantInstallWizard(models.TransientModel):
    _name = "modoops.tenant.install.wizard"
    _description = "Instalar/Quitar módulo del Catálogo ModoOps (mock)"

    tenant_id = fields.Many2one("modoops.tenant", required=True, readonly=True)
    module_key = fields.Selection(CATALOGO_MODOOPS, string="Módulo Catálogo", required=True)
    action = fields.Selection([("install", "Instalar"), ("remove", "Quitar")], default="install", required=True)
    preview_command = fields.Char(
        string="Preview odoo-bin",
        compute="_compute_preview_command",
        readonly=True,
        help="Comando auditable que el Control Plane ejecutará: odoo-bin -d <tenant> -i <modulo>",
    )
    notes = fields.Text(string="Notas", help="Motivo, ticket, validación")

    @api.depends("tenant_id.db_name", "module_key", "action")
    def _compute_preview_command(self):
        for rec in self:
            if not rec.tenant_id or not rec.module_key:
                rec.preview_command = False
                continue
            db = rec.tenant_id.db_name or "modoops_<slug>"
            # mapeo comercial → técnico para preview; usa module_key como fallback técnico
            label = CATALOGO_DICT.get(rec.module_key, rec.module_key)
            flag = "-i" if rec.action == "install" else "-u"
            rec.preview_command = f"odoo-bin -d {db} {flag} {rec.module_key}  # {label}"

    def action_confirm(self):
        self.ensure_one()
        tenant = self.tenant_id
        label = CATALOGO_DICT.get(self.module_key, self.module_key)
        current = [s.strip() for s in (tenant.modules_installed or "").split(",") if s.strip()]

        if self.action == "install":
            if label in current:
                raise UserError(_("Módulo '%s' ya figura instalado en %s.") % (label, tenant.db_name))
            current.append(label)
            tenant.write({"modules_installed": ", ".join(current)})
            tenant._log("install", f"{label} (mock) — {self.notes or 'Control Plane'}")
            tenant.message_post(body=_("Mock install %(mod)s en %(db)s — ejecutar: odoo-bin -d %(db)s -i <modulo_catálogo>") % {"mod": label, "db": tenant.db_name})
        else:
            if label not in current:
                raise UserError(_("Módulo '%s' no está instalado en %s.") % (label, tenant.db_name))
            current = [c for c in current if c != label]
            tenant.write({"modules_installed": ", ".join(current) if current else False})
            tenant._log("remove", f"{label} (mock) — {self.notes or 'Control Plane'}")
            tenant.message_post(body=_("Mock remove %(mod)s en %(db)s") % {"mod": label, "db": tenant.db_name})

        return {"type": "ir.actions.act_window_close"}
