from odoo import api, fields, models

from odoo.addons.modoops_admin.logic.lead_retention import retention_cutoff


class ModoopsLead(models.Model):
    _name = "modoops.lead"
    _description = "Lead de captación propia — aislado de Tenants, purgable"
    _order = "fecha_captura desc, id desc"

    nombre = fields.Char(required=True, index=True)
    direccion = fields.Char()
    telefono = fields.Char()
    email = fields.Char(help="Opcional; sin extracción bulk por defecto")
    web = fields.Char()
    categoria = fields.Char(index=True)
    rating = fields.Float()
    lat = fields.Float(digits=(10, 7))
    lon = fields.Float(digits=(10, 7))
    place_id = fields.Char(index=True, help="place_id/cid de la fuente")
    fuente = fields.Char(default="gosom/google-maps-scraper")
    fecha_captura = fields.Date(default=fields.Date.context_today, index=True)
    estado = fields.Selection(
        [("nuevo", "Nuevo"), ("contactado", "Contactado"), ("descartado", "Descartado")],
        default="nuevo",
        required=True,
        index=True,
    )
    opt_out = fields.Boolean(default=False, help="Baja pedida: purga inmediata")

    @api.model
    def purge_expired_leads(self):
        """Purga vencidos (>90d) y opt-out; audita conteo en modoops.tenant.log."""
        cutoff = retention_cutoff(fields.Date.context_today(self))
        expired = self.search(
            [
                "|",
                ("opt_out", "=", True),
                "&",
                ("fecha_captura", "!=", False),
                ("fecha_captura", "<=", cutoff),
            ]
        )
        count = len(expired)
        if count:
            self.env["modoops.tenant.log"].create(
                {
                    "action": "baja",
                    "detail": f"Purga leads: {count} (corte {cutoff.isoformat()})",
                }
            )
            expired.unlink()
        return count

    def action_opt_out(self):
        """Supresión inmediata ante baja pedida."""
        self.env["modoops.tenant.log"].create(
            {
                "action": "baja",
                "detail": f"Opt-out lead: {(self.nombre or '')[:200]}",
            }
        )
        self.unlink()
        return True
