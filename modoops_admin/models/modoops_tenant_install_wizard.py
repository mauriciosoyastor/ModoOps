from odoo import api, fields, models, _
from odoo.exceptions import UserError

from odoo.addons.modoops_admin.logic.modules_instalados import ModulesInstalados
from odoo.addons.modoops_admin.logic.tenant_module_service import apply_modules

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
    _description = "Instalar/Quitar módulo del Catálogo ModoOps (install = job real G7)"

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

    def _collect_labels(self) -> list[str]:
        if self.line_ids:
            return [CATALOGO_DICT.get(l.module_key, l.module_key) for l in self.line_ids]
        if not self.module_key:
            return []
        return [CATALOGO_DICT.get(self.module_key, self.module_key)]

    def _collect_keys(self) -> list[str]:
        if self.line_ids:
            return [l.module_key for l in self.line_ids]
        if not self.module_key:
            return []
        return [self.module_key]

    def _fail_duplicado(self, labels: list[str]):
        tenant = self.tenant_id
        current = ModulesInstalados.from_csv(tenant.modules_installed)
        try:
            apply_modules(current, labels, self.action)  # type: ignore[arg-type]
        except ValueError as e:
            msg = str(e)
            # mapear ValueError puro a mensaje con db_name para compatibilidad
            if "ya instalado" in msg:
                label = msg.split("'")[1] if "'" in msg else labels[0]
                raise UserError(_("Módulo '%s' ya figura instalado en %s.") % (label, tenant.db_name))
            if "no instalado" in msg:
                label = msg.split("'")[1] if "'" in msg else labels[0]
                raise UserError(_("Módulo '%s' no está instalado en %s.") % (label, tenant.db_name))
            raise UserError(_(msg))

    def action_confirm(self):
        self.ensure_one()
        tenant = self.tenant_id
        labels = self._collect_labels()
        if not labels:
            raise UserError(_("Seleccioná al menos un módulo del Catálogo."))
        # validación fail-fast (duplicados) antes de encolar/ejecutar
        self._fail_duplicado(labels)
        if self.action == "install":
            # G7 real: encola job, el cron instala en la DB tenant. Recién en
            # hecho se escribe modules_installed. Sin mock.
            job = self.env["modoops.tenant.install.job"].create(
                {
                    "tenant_id": tenant.id,
                    "module_keys": ",".join(self._collect_keys()),
                    "notes": self.notes or False,
                }
            )
            tenant._log("install_encolado", f"{','.join(labels)} — job {job.id}")
            return {"job_id": job.id, "preview_command": self.preview_command, "state": "pendiente"}
        # remove sigue mock (fuera de alcance G7: desinstalar puede perder datos)
        current = ModulesInstalados.from_csv(tenant.modules_installed)
        updated = apply_modules(current, labels, self.action)  # type: ignore[arg-type]
        tenant.write({"modules_installed": updated.to_csv()})
        # logs por cada label (preserva auditoría granular)
        for label in labels:
            tenant._log(self.action, f"{label} (mock) — {self.notes or 'Control Plane'}")
            tenant.message_post(body=_("Mock remove %(mod)s en %(db)s") % {"mod": label, "db": tenant.db_name})
        return {"type": "ir.actions.act_window_close"}
