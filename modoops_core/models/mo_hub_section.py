from odoo import fields, models


class SgHubSection(models.Model):
    _name = "mo.hub.section"
    _description = "Sección del rail de un hub modoops"
    _order = "app, sequence, id"

    app = fields.Selection(
        [
            ("inventory", "Stock"),
            ("sales", "Ventas"),
            ("purchase", "Compras"),
            ("accounting", "Cobros"),
            ("workshop", "Taller"),
        ],
        required=True,
        index=True,
    )
    code = fields.Char(required=True, index=True)
    name = fields.Char(required=True, translate=True)
    icon = fields.Char(default="fa-circle")
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)

    _sql_constraints = [
        (
            "mo_hub_section_app_code_uniq",
            "unique(app, code)",
            "El código de sección debe ser único por aplicación.",
        ),
    ]
