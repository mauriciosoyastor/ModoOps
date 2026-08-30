"""Guardarraíl Fiscal AR — feature-flag modoops.fiscal_enabled.

El ancla instala l10n_ar pero bloquea emisión hasta anexo fiscal firmado.
Ver CONTEXT.md: Cierre del anexo fiscal + CONTEXT.md fiscal guardrail.
"""
from odoo import api, models
from odoo.exceptions import UserError
from odoo import _


def _is_fiscal_enabled(env):
    Param = env["ir.config_parameter"].sudo()
    val = Param.get_param("modoops.fiscal_enabled", "False")
    return str(val).lower() in ("1", "true", "yes")


class AccountMoveFiscalGuard(models.Model):
    _inherit = "account.move"

    def action_post(self):
        if not _is_fiscal_enabled(self.env):
            # Permitir borradores y pruebas en staging sin postear fiscal
            # Bloquear solo si el move es de venta con tipo fiscal AR
            for move in self:
                if move.move_type in ("out_invoice", "out_refund") and move.journal_id.type == "sale":
                    # Heurística: si journal tiene l10n_ar activo, bloquear
                    raise UserError(
                        _(
                            "Emisión fiscal deshabilitada: el anexo fiscal aún no está firmado. "
                            "Activá Fiscal AR en el Control Plane (modoops.fiscal_enabled) tras validar con el asesor fiscal del Cliente."
                        )
                    )
        return super().action_post()


class ResConfigSettingsFiscal(models.TransientModel):
    _inherit = "res.config.settings"

    @api.model
    def get_modoops_fiscal_enabled(self):
        return _is_fiscal_enabled(self.env)

    def set_modoops_fiscal_enabled(self, value: bool):
        self.env["ir.config_parameter"].sudo().set_param(
            "modoops.fiscal_enabled", str(bool(value))
        )
