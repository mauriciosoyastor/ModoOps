import re

from odoo import api, fields, models, _
from odoo.exceptions import UserError

from odoo.addons.modoops_admin.logic.modules_instalados import ModulesInstalados
from odoo.addons.modoops_admin.logic.tenant_lifecycle import (
    can_mark_baja,
    can_reactivate,
    can_suspend,
    suspend_grace_until,
)
# modoops_catalogo es paquete puro (no addon Odoo) — import directo sin odoo.addons
try:
    from modoops_catalogo._generated_selection import CATALOGO_MODOOPS, CATALOGO_DICT
except ImportError:
    from odoo.addons.modoops_catalogo._generated_selection import CATALOGO_MODOOPS, CATALOGO_DICT  # fallback si se instala como addon

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
    phone = fields.Char(string="WhatsApp cliente", tracking=True, help="Ej: 3547532008 — avisos mora día 1 y 5")
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
    contrato_ids = fields.One2many("modoops.tenant.contrato", "tenant_id", string="Contratos")
    contrato_count = fields.Integer(string="Contratos #", compute="_compute_contrato_resumen", store=False)
    saldo_pendiente_usd = fields.Float(string="Saldo ancla pendiente USD", compute="_compute_contrato_resumen", store=False)
    situacion = fields.Char(string="Situación contrato", compute="_compute_contrato_resumen", store=False)

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

    @api.depends("contrato_ids.state", "contrato_ids.saldo_usd", "contrato_ids.saldo_cobrado")
    def _compute_contrato_resumen(self):
        from odoo.addons.modoops_admin.logic.contrato_situacion import situacion_contrato

        for rec in self:
            rec.contrato_count = len(rec.contrato_ids)
            vigentes = rec.contrato_ids.filtered(lambda c: c.state == "vigente")
            ref = vigentes[:1] if vigentes else rec.contrato_ids[:1]
            if not ref:
                rec.saldo_pendiente_usd = 0.0
                rec.situacion = "sin_contrato"
                continue
            c = ref[0]
            rec.saldo_pendiente_usd = 0.0 if c.saldo_cobrado else (c.saldo_usd or 0.0)
            sem, _det = situacion_contrato(
                tenant_state=rec.state,
                contrato_state=c.state,
                hito2_ok=bool(c.hito2_ok),
                saldo_cobrado=bool(c.saldo_cobrado),
                go_live_date=c.go_live_date,
                abono_due_date=rec.abono_due_date,
                today=rec._get_today(),
            )
            rec.situacion = sem

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

    def action_enviar_aviso_mora(self):
        """Aviso manual día 1/5: log + chatter con link wa.me. Golden path sin gateway."""
        from odoo.addons.modoops_admin.logic.avisos_mora import (
            debe_avisar,
            mensaje_aviso,
            mora_days,
            whatsapp_link,
        )

        for rec in self:
            rec.ensure_one()
            today = rec._get_today()
            ok, motivo = debe_avisar(
                tenant_state=rec.state,
                abono_due_date=rec.abono_due_date,
                today=today,
                last_warning_sent=rec.last_warning_sent,
            )
            if not ok:
                raise UserError(_("Sin aviso: %s.") % motivo)
            dia = mora_days(rec.abono_due_date, today) or 0
            msg = mensaje_aviso(
                dia_mora=dia, tenant_name=rec.name,
                abono_due_date=rec.abono_due_date, situacion=rec.situacion or "",
            )
            link = whatsapp_link(rec.phone, msg)
            rec.write({"last_warning_sent": today})
            rec._log("aviso", f"Día {dia} mora — WhatsApp {rec.phone or 'sin teléfono'}")
            rec.message_post(body=_("Aviso mora día %(dia)s — <a href='%(link)s' target='_blank'>Abrir WhatsApp</a>: %(msg)s") % {"dia": dia, "link": link, "msg": msg})
        return {
            "type": "ir.actions.act_url",
            "url": link,
            "target": "new",
        }

    @api.model
    def cron_avisos_mora(self):
        """Cron diario: avisa día 1 y 5 de mora, una vez por día."""
        from odoo.addons.modoops_admin.logic.avisos_mora import debe_avisar

        today = fields.Date.context_today(self)
        domain = [("state", "=", "activo"), ("abono_due_date", "<", today)]
        count = 0
        for rec in self.search(domain):
            ok, _mot = debe_avisar(
                tenant_state=rec.state,
                abono_due_date=rec.abono_due_date,
                today=today,
                last_warning_sent=rec.last_warning_sent,
            )
            if not ok:
                continue
            try:
                rec.action_enviar_aviso_mora()
                count += 1
            except Exception:
                continue
        return count
