from odoo import api, fields, models, _
from odoo.exceptions import UserError

from .modoops_tenant import CATALOGO_MODOOPS, CATALOGO_DICT


class ModoopsTenantInstallWizardLine(models.TransientModel):
    _name = "modoops.tenant.install.wizard.line"
    _description = "Línea Wizard Catálogo — módulo + preview"

    wizard_id = fields.Many2one("modoops.tenant.install.wizard", required=True, ondelete="cascade")
    module_key = fields.Selection(CATALOGO_MODOOPS, string="Módulo Catálogo", required=True)
    preview_command = fields.Char(
        string="Preview",
        compute="_compute_preview_command",
        readonly=True,
    )

    @api.depends("wizard_id.tenant_id.db_name", "module_key", "wizard_id.action")
    def _compute_preview_command(self):
        for rec in self:
            db = rec.wizard_id.tenant_id.db_name or "modoops_<slug>"
            label = CATALOGO_DICT.get(rec.module_key, rec.module_key)
            flag = "-i" if rec.wizard_id.action == "install" else "-u"
            rec.preview_command = f"odoo-bin -d {db} {flag} {rec.module_key}  # {label}"


class ModoopsTenantInstallWizard(models.TransientModel):
    _name = "modoops.tenant.install.wizard"
    _description = "Instalar/Quitar módulo del Catálogo ModoOps (mock)"

    tenant_id = fields.Many2one("modoops.tenant", required=True, readonly=True)
    module_key = fields.Selection(CATALOGO_MODOOPS, string="Módulo Catálogo")
    action = fields.Selection([("install", "Instalar"), ("remove", "Quitar")], default="install", required=True)
    line_ids = fields.One2many(
        "modoops.tenant.install.wizard.line",
        "wizard_id",
        string="Módulos seleccionados (cards Ancla/Add-on)",
        help="Multi-select batch — cada línea es una card del Catálogo con preview odoo-bin",
    )
    preview_command = fields.Char(
        string="Preview odoo-bin",
        compute="_compute_preview_command",
        readonly=True,
        help="Comando auditable que el Control Plane ejecutará: odoo-bin -d <tenant> -i <modulo>",
    )
    notes = fields.Text(string="Notas", help="Motivo, ticket, validación")

    @api.depends("tenant_id.db_name", "module_key", "action", "line_ids.module_key")
    def _compute_preview_command(self):
        for rec in self:
            # batch preview si hay líneas
            if rec.line_ids:
                db = rec.tenant_id.db_name or "modoops_<slug>"
                flag = "-i" if rec.action == "install" else "-u"
                mods = ", ".join(f"{l.module_key}" for l in rec.line_ids)
                rec.preview_command = f"odoo-bin -d {db} {flag} {mods}  # batch {len(rec.line_ids)}"
                continue
            if not rec.tenant_id or not rec.module_key:
                rec.preview_command = False
                continue
            db = rec.tenant_id.db_name or "modoops_<slug>"
            label = CATALOGO_DICT.get(rec.module_key, rec.module_key)
            flag = "-i" if rec.action == "install" else "-u"
            rec.preview_command = f"odoo-bin -d {db} {flag} {rec.module_key}  # {label}"

    def action_confirm(self):
        self.ensure_one()
        tenant = self.tenant_id
        # batch: line_ids si existen, si no single module_key (backward compat)
        if self.line_ids:
            for line in self.line_ids:
                label = CATALOGO_DICT.get(line.module_key, line.module_key)
                current = [s.strip() for s in (tenant.modules_installed or "").split(",") if s.strip()]
                if self.action == "install":
                    if label in current:
                        raise UserError(_("Módulo '%s' ya figura instalado en %s.") % (label, tenant.db_name))
                    current.append(label)
                    tenant.write({"modules_installed": ", ".join(current)})
                    tenant._log("install", f"{label} (mock) — {self.notes or 'Control Plane'}")
                    tenant.message_post(body=_("Mock install %(mod)s en %(db)s — ejecutar: odoo-bin -d %(db)s -i %(mod)s") % {"mod": label, "db": tenant.db_name, "mod": label})
                else:
                    if label not in current:
                        raise UserError(_("Módulo '%s' no está instalado en %s.") % (label, tenant.db_name))
                    current = [c for c in current if c != label]
                    tenant.write({"modules_installed": ", ".join(current) if current else False})
                    tenant._log("remove", f"{label} (mock) — {self.notes or 'Control Plane'}")
                    tenant.message_post(body=_("Mock remove %(mod)s en %(db)s") % {"mod": label, "db": tenant.db_name})
            return {"type": "ir.actions.act_window_close"}
        # fallback single
        if not self.module_key:
            raise UserError(_("Seleccioná al menos un módulo del Catálogo."))
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
