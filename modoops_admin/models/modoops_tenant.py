import re

from odoo import api, fields, models, _
from odoo.exceptions import UserError

from modoops_admin.logic.modules_instalados import ModulesInstalados
from modoops_admin.logic.tenant_lifecycle import (
    can_mark_baja,
    can_reactivate,
    can_suspend,
    suspend_grace_until,
)
from modoops_catalogo._generated_selection import CATALOGO_MODOOPS, CATALOGO_DICT

DB_PREFIX = "modoops_"
SLUG_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*$")


class ModoopsTenant(models.Model):
    _name = "modoops.tenant"
    _description = "Tenant ModoOps (cliente aislado Multi-DB)"
    _order = "abono_due_date asc, state, name"
    _inherit = ["mail.thread", "mail.activity.mixin"]

    name = fields.Char(
        string="Cliente",
        required=True,
        tracking=True,
        help="Nombre comercial, ej: Pinturería Centro",
    )
    db_name = fields.Char(
        string="Base DB",
        required=True,
        tracking=True,
        help="modoops_<slug>, ej: modoops_pintureria_centro",
    )
    slug = fields.Char(
        string="Slug",
        tracking=True,
        help="slug para db_name, ej: pintureria_centro (a-z0-9_)",
    )
    vertical = fields.Selection(
        [("retail", "Retail"), ("servicios", "Servicios"), ("distribucion", "Distribución")],
        string="Vertical",
        default="retail",
        tracking=True,
    )
    state = fields.Selection(
        [("activo", "Activo"), ("suspendido", "Suspendido"), ("baja", "Baja")],
        string="Estado",
        default="activo",
        tracking=True,
    )
    abono_due_date = fields.Date(string="Vencimiento abono", tracking=True)
    suspend_grace_until = fields.Date(
        string="Gracia hasta",
        compute="_compute_suspend_grace_until",
        store=True,
        help="abono_due_date + 7 días (CONTEXT.md Suspensión por mora)",
    )
    last_warning_sent = fields.Date(string="Último aviso mora")
    modules_installed = fields.Text(
        string="Módulos instalados",
        help="Lista del Catálogo ModoOps, ej: Mostrador, Depósito, Fiscal AR",
    )
    modules_installed_count = fields.Integer(
        string="Módulos #",
        compute="_compute_modules_installed_count",
        store=False,
        help="Conteo de módulos del Catálogo instalados (lista+hub, AA semáforo)",
    )
    last_backup = fields.Datetime(string="Último backup")
    notes = fields.Text(string="Notas")

    def _get_today(self):
        """Seam testeable: hoy vía context_today, inyectable con FixedClock en tests puros."""
        return fields.Date.context_today(self)

    @api.depends("abono_due_date")
    def _compute_suspend_grace_until(self):
        for rec in self:
            rec.suspend_grace_until = suspend_grace_until(rec.abono_due_date) or False

    @api.depends("modules_installed")
    def _compute_modules_installed_count(self):
        for rec in self:
            rec.modules_installed_count = ModulesInstalados.from_csv(rec.modules_installed).count

    @api.constrains("slug", "db_name")
    def _check_slug_db(self):
        for rec in self:
            if rec.slug and not SLUG_RE.match(rec.slug):
                raise UserError(_("Slug inválido '%s': solo a-z, 0-9 y _ (ej: pintureria_centro).") % rec.slug)
            if rec.db_name:
                if not rec.db_name.startswith(DB_PREFIX):
                    raise UserError(_("db_name debe empezar con '%s' (ej: modoops_pintureria_centro).") % DB_PREFIX)
                slug_part = rec.db_name[len(DB_PREFIX):]
                if not SLUG_RE.match(slug_part):
                    raise UserError(_("db_name slug inválido '%s'.") % slug_part)
                if rec.slug and slug_part != rec.slug:
                    raise UserError(_("db_name '%s' no coincide con slug '%s'.") % (rec.db_name, rec.slug))

    @api.onchange("name", "slug")
    def _onchange_slug_db(self):
        for rec in self:
            if not rec.slug and rec.name:
                auto = re.sub(r"[^a-z0-9]+", "_", rec.name.lower()).strip("_")
                auto = re.sub(r"_+", "_", auto)
                rec.slug = auto[:40]
            if rec.slug and not rec.db_name:
                rec.db_name = f"{DB_PREFIX}{rec.slug}"

    def _log(self, action, detail=""):
        self.ensure_one()
        self.env["modoops.tenant.log"].create(
            {
                "tenant_id": self.id,
                "action": action,
                "detail": detail[:500] if detail else False,
            }
        )
        self.message_post(body=_("Tenant %(db)s — %(act)s: %(det)s") % {"db": self.db_name, "act": action, "det": detail or "-"})

    def action_install_module(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "res_model": "modoops.tenant.install.wizard",
            "view_mode": "form",
            "target": "new",
            "context": {"default_tenant_id": self.id},
        }

    def action_suspend(self):
        for rec in self:
            err = can_suspend(rec.state, rec._get_today(), rec.suspend_grace_until)
            if err:
                raise UserError(_(err))
            rec.write({"state": "suspendido"})
            rec._log("suspendido", "Login bloqueado — gracia vencida")
        return True

    def action_reactivate(self):
        for rec in self:
            err = can_reactivate(rec.state)
            if err:
                raise UserError(_(err))
            rec.write({"state": "activo"})
            rec._log("reactivado", "Pago/abono regularizado")
        return True

    def action_mark_baja(self):
        for rec in self:
            err = can_mark_baja(rec.state, rec._get_today(), rec.abono_due_date)
            if err:
                raise UserError(_(err))
            rec.write({"state": "baja"})
            rec._log("baja", "Backup final + cierre — requiere confirmación explícita")
        return True
