import json
import secrets
import time

from odoo import _, models
from odoo.exceptions import UserError
from odoo.http import request

HANDOFF_PREFIX = "modoops_pos_handoff_"
HANDOFF_TTL_S = 60


class PosConfig(models.Model):
    _inherit = "pos.config"

    def modoops_preparar_entrada(self, fondo):
        """Abre la sesión con el fondo y devuelve un token de un solo uso."""
        self.ensure_one()
        monto = float(fondo or 0.0)
        if monto < 0:
            raise UserError(_("El fondo inicial no puede ser negativo."))
        if not self.current_session_id:
            self.open_ui()
            self.invalidate_recordset(["current_session_id"])
        session = self.current_session_id
        if session and session.state == "opening_control":
            session.set_opening_control(monto, "")
            # Sin un medio que cuente efectivo, Odoo abre el turno y descarta el monto.
            if not self.payment_method_ids.filtered("is_cash_count"):
                session.cash_register_balance_start = monto
        token = secrets.token_urlsafe(24)
        payload = json.dumps(
            {
                "sid": request.session.sid,
                "config_id": self.id,
                "exp": time.time() + HANDOFF_TTL_S,
            }
        )
        self.env["ir.config_parameter"].sudo().set_param(HANDOFF_PREFIX + token, payload)
        return {"token": token, "config_id": self.id}

    def modoops_pasar_a_pesos(self):
        """La caja cobra en pesos: la compañía y sus listas dejan el dólar."""
        ars = self.env["res.currency"].with_context(active_test=False).search([("name", "=", "ARS")], limit=1)
        if not ars:
            raise UserError(_("No está cargado el peso argentino."))
        if not ars.active:
            ars.active = True
        companies = self.company_id
        for company in companies:
            if company.currency_id != ars:
                company.currency_id = ars
        listas = self.pricelist_id | self.available_pricelist_ids
        listas.filtered(lambda lista: lista.currency_id != ars).write({"currency_id": ars.id})
        return {"currency": "ARS", "companies": companies.ids, "pricelists": listas.ids}
