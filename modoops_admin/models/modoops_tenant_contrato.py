from odoo import api, fields, models, _

from odoo.addons.modoops_admin.logic.contrato_situacion import situacion_contrato


class ModoopsTenantContrato(models.Model):
    _name = "modoops.tenant.contrato"
    _description = "Contrato ModoOps por Tenant (ancla 50/25/25 + abono)"
    _order = "fecha_firma desc, id desc"
    _inherit = ["mail.thread", "mail.activity.mixin"]

    name = fields.Char(string="N° Contrato", required=True, tracking=True, help="Ej: MO-2026-001")
    tenant_id = fields.Many2one(
        "modoops.tenant", string="Tenant", required=True, ondelete="cascade", index=True, tracking=True,
    )
    tipo = fields.Selection(
        [("descubrimiento", "Descubrimiento $155"), ("ancla", "Paquete ancla"), ("addon", "Add-on"), ("abono", "Abono mensual")],
        string="Tipo", default="ancla", required=True, tracking=True,
    )
    state = fields.Selection(
        [("borrador", "Borrador"), ("vigente", "Vigente"), ("finalizado", "Finalizado"), ("rescindido", "Rescindido")],
        string="Estado", default="borrador", required=True, tracking=True,
    )
    fecha_firma = fields.Date(string="Firma", tracking=True)
    moneda = fields.Selection([("USD", "USD"), ("ARS", "ARS")], string="Moneda", default="USD", required=True)
    monto_total_usd = fields.Float(string="Total USD", help="Ref ancla $800")
    anticipo_usd = fields.Float(string="Anticipo 50% USD", help="Condición previa para iniciar Fase 1")
    saldo_usd = fields.Float(string="Saldo USD", compute="_compute_saldo", store=True,
                              help="Resto tras anticipo (25% Hito 1 + 25% Hito 2)")
    anticipo_cobrado = fields.Boolean(string="Anticipo cobrado", tracking=True)
    hito1_cobrado = fields.Boolean(string="Hito 1 cobrado (25%)", tracking=True)
    saldo_cobrado = fields.Boolean(string="Saldo cobrado (25% final)", tracking=True)
    hito1_ok = fields.Boolean(string="Hito 1 staging OK", tracking=True)
    hito2_ok = fields.Boolean(string="Hito 2 go-live OK", tracking=True)
    go_live_date = fields.Date(string="Go-live", tracking=True)
    hipercare_hasta = fields.Date(string="Hipercare hasta (10 días hábiles)")
    anexo_fiscal_ok = fields.Boolean(string="Anexo B fiscal cerrado", tracking=True, help="Validado por contador del cliente")
    abono_mensual_usd = fields.Float(string="Abono USD/mes", default=50.0, help="Ref $50/mes, 4h + best effort bugs")
    ajustes_horas_pactadas = fields.Float(string="Ajustes pactados (h)", default=8.0)
    ajustes_horas_consumidas = fields.Float(string="Ajustes consumidas (h)")
    capacitacion_horas_pactadas = fields.Float(string="Capacitación pactada (h)", default=6.0)
    capacitacion_horas_dadas = fields.Float(string="Capacitación dada (h)")
    contrato_pdf = fields.Binary(string="Contrato PDF firmado", attachment=True)
    contrato_pdf_filename = fields.Char(string="Nombre PDF")
    situacion = fields.Char(string="Situación", compute="_compute_situacion", store=False)
    situacion_detalle = fields.Char(string="Detalle situación", compute="_compute_situacion", store=False)
    notes = fields.Text(string="Notas")

    @api.depends("monto_total_usd", "anticipo_usd")
    def _compute_saldo(self):
        for rec in self:
            rec.saldo_usd = (rec.monto_total_usd or 0.0) - (rec.anticipo_usd or 0.0)

    @api.depends(
        "state", "hito1_ok", "hito1_cobrado", "hito2_ok", "saldo_cobrado", "go_live_date",
        "tenant_id.state", "tenant_id.abono_due_date",
    )
    def _compute_situacion(self):
        for rec in self:
            sem, det = situacion_contrato(
                tenant_state=rec.tenant_id.state if rec.tenant_id else "activo",
                contrato_state=rec.state,
                hito1_ok=bool(rec.hito1_ok),
                hito1_cobrado=bool(rec.hito1_cobrado),
                hito2_ok=bool(rec.hito2_ok),
                saldo_cobrado=bool(rec.saldo_cobrado),
                go_live_date=rec.go_live_date,
                abono_due_date=rec.tenant_id.abono_due_date if rec.tenant_id else None,
                today=fields.Date.context_today(rec),
            )
            rec.situacion = sem
            rec.situacion_detalle = det

    def action_marcar_vigente(self):
        for rec in self:
            if not rec.anticipo_cobrado:
                from odoo.exceptions import UserError
                raise UserError(_("No se puede vigentar sin anticipo 50% cobrado (condición de inicio)."))
            rec.write({"state": "vigente"})
        return True

    def action_marcar_finalizado(self):
        for rec in self:
            if not (rec.hito2_ok and rec.saldo_cobrado):
                from odoo.exceptions import UserError
                raise UserError(_("Solo se finaliza con Hito 2 OK + saldo cobrado (acta firmada)."))
            rec.write({"state": "finalizado"})
        return True

    def action_imprimir_acta_pdf(self):
        """Abre el PDF QWeb del acta (logo = logo compañía vía external_layout)."""
        self.ensure_one()
        return self.env.ref("modoops_admin.report_modoops_acta_hito2").report_action(self)

    def action_generar_acta_hito2(self):
        """Genera acta Hito 2 como adjunto descargable + log. Sin report engine."""
        import base64

        from odoo.addons.modoops_admin.logic.avisos_mora import acta_hito2_texto

        for rec in self:
            rec.ensure_one()
            texto = acta_hito2_texto(
                contrato_name=rec.name or "",
                tenant_name=rec.tenant_id.name if rec.tenant_id else "",
                db_name=rec.tenant_id.db_name if rec.tenant_id else "",
                monto_total=rec.monto_total_usd or 0.0,
                # Ancla 50/25/25: el saldo_usd cubre Hito 1 + Hito 2; el acta Hito 2 cobra la mitad.
                saldo=(rec.saldo_usd or 0.0) / 2,
                moneda=rec.moneda or "USD",
                go_live_date=rec.go_live_date,
                anexo_fiscal_ok=bool(rec.anexo_fiscal_ok),
                pendientes=rec.notes or "",
            )
            data = base64.b64encode(texto.encode("utf-8")).decode("ascii")
            fname = f"Acta-Hito2-{rec.name or 'contrato'}.txt"
            try:
                att = self.env["ir.attachment"].create(
                    {"name": fname, "type": "binary", "datas": data, "mimetype": "text/plain"}
                )
                rec.message_post(body=_("Acta Hito 2 generada — %(f)s"), attachment_ids=[att.id])
                if rec.tenant_id:
                    rec.tenant_id._log("aviso", f"Acta Hito 2 {rec.name} generada")
                return {
                    "type": "ir.actions.act_url",
                    "url": f"/web/content/{att.id}?download=true",
                    "target": "self",
                    "filename": fname,
                }
            except Exception:
                return {"filename": fname, "texto": texto}
