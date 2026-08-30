from odoo import fields, models


class AccountMove(models.Model):
    _inherit = "account.move"

    def _get_name_invoice_report(self):
        """Use modoops-branded invoice QWeb (primary inherit) for shell PDFs."""
        self.ensure_one()
        return "modoops_core.report_invoice_document_modoops"

    mo_fw_loaded = fields.Boolean(
        string="Cargada en Factura Web",
        default=False,
        index=True,
        help="Marcada cuando la FC ya se cargó manualmente en Factura Web.",
    )
    mo_fw_loaded_at = fields.Datetime(
        string="Fecha carga Factura Web",
        help="Momento en que se marcó como cargada en Factura Web.",
    )
    mo_fw_number = fields.Char(
        string="N° Factura Web",
        help="Número de comprobante en Factura Web (opcional).",
    )
    mo_bill_source = fields.Selection(
        [
            ("whatsapp", "WhatsApp"),
            ("mail", "Mail"),
            ("other", "Otro"),
        ],
        string="Origen del comprobante",
        help="Canal por el que llegó la factura de proveedor (WhatsApp, mail u otro).",
    )
