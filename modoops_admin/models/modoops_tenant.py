import re

from odoo import api, fields, models, _
from odoo.exceptions import UserError

CATALOGO_MODOOPS = [
    ("mostrador", "Mostrador (POS 2 cajas)"),
    ("deposito", "Depósito Inteligente (1 almacén)"),
    ("compras", "Compras"),
    ("fiscal_ar", "Fiscal AR"),
    ("contactos", "Contactos"),
    ("migracion_excel", "Migración Excel (≤500 prod)"),
    ("taller", "Taller (Add-on $155)"),
    ("b2b_basico", "B2B Básico (Add-on $155)"),
    ("ia", "IA ModoOps — Agente herramental (Tools + Memoria)"),
]

CATALOGO_DICT = dict(CATALOGO_MODOOPS)
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

    @api.depends("abono_due_date")
    def _compute_suspend_grace_until(self):
        for rec in self:
            if rec.abono_due_date:
                rec.suspend_grace_until = fields.Date.add(rec.abono_due_date, days=7)
            else:
                rec.suspend_grace_until = False

    @api.depends("modules_installed")
    def _compute_modules_installed_count(self):
        for rec in self:
            if not rec.modules_installed:
                rec.modules_installed_count = 0
            else:
                parts = [s.strip() for s in rec.modules_installed.split(",") if s.strip()]
                rec.modules_installed_count = len(parts)

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
            if rec.state == "baja":
                raise UserError(_("Tenant en Baja no se puede suspender. Restaurá desde backup."))
            if rec.state == "suspendido":
                raise UserError(_("Tenant ya está Suspendido."))
            # Guardarraíl: solo desde día 8
            today = fields.Date.context_today(rec)
            if rec.suspend_grace_until and today < rec.suspend_grace_until:
                delta = (rec.suspend_grace_until - today).days
                raise UserError(
                    _("Gracia activa hasta %(until)s — faltan %(days)s días. Avisar por WhatsApp antes de suspender (CONTEXT.md gracia 7 días).")
                    % {"until": rec.suspend_grace_until, "days": delta}
                )
            rec.write({"state": "suspendido"})
            rec._log("suspendido", "Login bloqueado — gracia vencida")
        return True

    def action_reactivate(self):
        for rec in self:
            if rec.state != "suspendido":
                raise UserError(_("Solo se reactiva un Suspendido."))
            rec.write({"state": "activo"})
            rec._log("reactivado", "Pago/abono regularizado")
        return True

    def action_mark_baja(self):
        for rec in self:
            if rec.state != "suspendido":
                raise UserError(_("Solo un Suspendido puede pasar a Baja (día 15, tras backup final)."))
            today = fields.Date.context_today(rec)
            if rec.abono_due_date and today < fields.Date.add(rec.abono_due_date, days=15):
                raise UserError(_("Baja solo desde día 15 de mora (backup final). Hoy faltan días."))
            rec.write({"state": "baja"})
            rec._log("baja", "Backup final + cierre — requiere confirmación explícita")
        return True
