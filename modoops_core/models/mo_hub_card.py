import logging

from odoo import api, fields, models, _
from odoo.tools.safe_eval import safe_eval

_logger = logging.getLogger(__name__)


class SgHubCard(models.Model):
    _name = "mo.hub.card"
    _description = "KPI card de ingreso en hub modoops"
    _order = "section, sequence, id"
    _inherit = ["mo.metric.mixin"]
    _metric_cache_key = "_mo_hub_metrics_cache"

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
    section = fields.Char(required=True, index=True)
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)
    show_in_summary = fields.Boolean(
        string="Mostrar en Resumen",
        default=False,
        help="Si está activo, la card aparece en la sección Resumen del hub.",
    )
    label = fields.Char(required=True, translate=True)
    hint = fields.Char(translate=True)
    icon = fields.Char(default="fa-cube")
    variant = fields.Selection(
        [("default", "Default"), ("warning", "Warning")],
        default="default",
    )
    accent_key = fields.Selection(
        [
            ("flame-yellow", "Amarillo llama"),
            ("flame-orange", "Naranja llama"),
            ("flame-deep", "Naranja profundo"),
            ("flame-rust", "Óxido"),
            ("ember-amber", "Ámbar"),
            ("ember-coral", "Coral"),
            ("ember-scarlet", "Escarlata"),
            ("ember-wine", "Vino"),
            ("bg-mid", "Gris medio"),
            ("bg-charcoal", "Carbón"),
            ("bg-deep", "Carbón profundo"),
        ],
        string="Acento",
        help="Acento visual de la KPI card (misma paleta que el launcher). "
        "Vacío = el shell rota flame/ember por índice.",
    )
    enter_label = fields.Char(
        string="Texto de ingreso",
        default="Ingresar →",
        translate=True,
    )
    action_id = fields.Many2one("ir.actions.act_window", required=True, ondelete="restrict")
    domain = fields.Char(default="[]")
    context = fields.Char(default="{}")

    def _eval_context(self, context_str):
        if not context_str:
            return {}
        try:
            return safe_eval(context_str)
        except Exception:
            _logger.warning("Contexto inválido en mo.hub.card %s: %s", self.id, context_str)
            return {}

    def _get_action_payload(self):
        self.ensure_one()
        action = self.action_id.sudo()
        base_context = {}
        if action.context:
            ctx = action.context
            base_context = self._eval_context(ctx) if isinstance(ctx, str) else dict(ctx)
        merged_context = {**base_context, **self._eval_context(self.context)}
        payload = {
            "type": "ir.actions.act_window",
            "name": self.label,
            "res_model": action.res_model,
            "view_mode": action.view_mode,
            "domain": self._eval_domain(self.domain),
            "context": merged_context,
            "target": action.target or "current",
        }
        if action.views:
            payload["views"] = action.views
        return payload

    def _serialize_card(self):
        self.ensure_one()
        return {
            "id": self.id,
            "label": self.label,
            "hint": self.hint or "",
            "icon": self.icon or "fa-circle",
            "variant": self.variant,
            "accent_key": self.accent_key or "",
            "enter_label": self.enter_label or _("Ingresar →"),
            "value": self._get_metric_display(),
            "action": self._get_action_payload(),
        }

    _HUB_ACCENT_CYCLE = (
        "flame-yellow",
        "flame-orange",
        "flame-deep",
        "flame-rust",
        "ember-amber",
        "ember-coral",
        "ember-scarlet",
        "ember-wine",
    )

    @api.model
    def _setup_hub_card_accents_for_app(self, app):
        """Rota acentos flame/ember por sección (cada pestaña arranca en amarillo)."""
        cards = self.search([("app", "=", app)], order="section, sequence, id")
        cycle = self._HUB_ACCENT_CYCLE
        index_by_section = {}
        for card in cards:
            section = card.section or "summary"
            index = index_by_section.get(section, 0)
            index_by_section[section] = index + 1
            accent = cycle[index % len(cycle)]
            if card.accent_key != accent:
                card.write({"accent_key": accent})

    @api.model
    def setup_inventory_hub_card_accents(self):
        self._setup_hub_card_accents_for_app("inventory")
        self.apply_inventory_hub_copy()

    @api.model
    def apply_inventory_hub_copy(self):
        """Force-update inventory hub copy (noupdate XML cards)."""
        updates = {
            "modoops_core.hub_card_inv_summary_variants": {
                "label": "Variantes",
                "enter_label": "Ver variantes →",
            },
            "modoops_core.hub_card_inv_products_variants": {
                "label": "Variantes",
            },
            "modoops_core.hub_card_inv_summary_transfers": {
                "label": "Movimientos de stock",
                "enter_label": "Ver movimientos →",
            },
            "modoops_core.hub_card_inv_ops_all": {
                "label": "Todos los movimientos",
            },
            "modoops_core.hub_card_inv_ops_internal": {
                "label": "Movimientos internos",
            },
            "modoops_core.hub_card_inv_ops_quants": {
                "label": "Existencias",
            },
            "modoops_core.hub_card_inv_report_replenish": {
                "label": "Reglas de reabastecimiento",
            },
        }
        for xmlid, values in updates.items():
            card = self.env.ref(xmlid, raise_if_not_found=False)
            if not card:
                continue
            to_write = {
                field: value
                for field, value in values.items()
                if card[field] != value
            }
            if to_write:
                card.write(to_write)

    @api.model
    def setup_sales_hub_card_accents(self):
        self._setup_hub_card_accents_for_app("sales")
        self.apply_sales_hub_copy()

    @api.model
    def apply_sales_hub_copy(self):
        """Force-update sales hub copy + Cotizaciones tab (noupdate XML)."""
        Section = self.env["mo.hub.section"]
        section_updates = {
            "modoops_core.hub_section_sales_quotations": {
                "name": "Cotizaciones",
                "sequence": 2,
                "active": True,
            },
            "modoops_core.hub_section_sales_orders": {"sequence": 3},
            "modoops_core.hub_section_sales_customers": {"sequence": 4},
            "modoops_core.hub_section_sales_reporting": {"sequence": 5},
            "modoops_core.hub_section_sales_config": {"sequence": 6},
        }
        for xmlid, values in section_updates.items():
            section = self.env.ref(xmlid, raise_if_not_found=False)
            if not section:
                continue
            to_write = {
                field: value
                for field, value in values.items()
                if section[field] != value
            }
            if to_write:
                section.write(to_write)

        updates = {
            "modoops_core.hub_card_sales_quotations_open": {
                "label": "Cotizaciones",
                "hint": "Borradores y enviadas",
                "enter_label": "Ver cotizaciones →",
                "section": "quotations",
                "active": True,
            },
            "modoops_core.hub_card_sales_quotations_history": {
                "label": "Historial de cotizaciones",
                "hint": "Todas las cotizaciones y pedidos",
                "enter_label": "Ver historial →",
                "section": "quotations",
                "active": True,
            },
            # Redundant with Cotizaciones (draft ⊂ draft+sent).
            "modoops_core.hub_card_sales_quotations_draft": {"active": False},
            "modoops_core.hub_card_sales_orders_draft": {"active": False},
            # Cotizaciones ya tiene su pestaña; no repetir en Pedidos.
            "modoops_core.hub_card_sales_orders_quotations": {"active": False},
            "modoops_core.hub_card_sales_summary_quotations": {
                "label": "Cotizaciones",
                "hint": "Borradores y enviadas",
                "enter_label": "Ver cotizaciones →",
            },
            "modoops_core.hub_card_sales_summary_confirmed": {
                "hint": "Pedidos en estado venta",
            },
            "modoops_core.hub_card_sales_orders_to_invoice": {
                "label": "Por facturar",
            },
            "modoops_core.hub_card_sales_orders_upselling": {
                "label": "Pedidos con más por facturar",
            },
            "modoops_core.hub_card_sales_orders_pos": {
                "label": "Ventas de caja",
                "hint": "Historial mostrador",
                "enter_label": "Ver ventas de caja →",
            },
            "modoops_core.hub_card_sales_summary_pos_today": {
                "label": "Ventas de mostrador hoy",
                "hint": "Pedidos de mostrador del día",
                "enter_label": "Ver ventas de caja →",
            },
            # Odoo 19: sale_order_count is non-stored; search/metric need sale_order_ids.
            "modoops_core.hub_card_sales_customers_with_orders": {
                "domain": "[('sale_order_ids', '!=', False)]",
                "metric_domain": "[('sale_order_ids', '!=', False)]",
            },
        }
        for xmlid, values in updates.items():
            card = self.env.ref(xmlid, raise_if_not_found=False)
            if not card:
                continue
            to_write = {
                field: value
                for field, value in values.items()
                if card[field] != value
            }
            if to_write:
                card.write(to_write)

    @api.model
    def setup_purchase_hub_card_accents(self):
        self._setup_hub_card_accents_for_app("purchase")
        self.apply_purchase_hub_copy()

    @api.model
    def apply_purchase_hub_copy(self):
        """Force-update purchase hub copy (noupdate XML cards)."""
        section = self.env.ref(
            "modoops_core.hub_section_purchase_orders", raise_if_not_found=False
        )
        if section and section.name != "Pedidos":
            section.write({"name": "Pedidos"})
        updates = {
            "modoops_core.hub_card_purchase_summary_rfq": {
                "label": "Pedidos a proveedor",
                "hint": "Borradores + enviados",
                "enter_label": "Ver pedidos →",
            },
            "modoops_core.hub_card_purchase_orders_rfq": {
                "label": "Pedidos a proveedor",
            },
            "modoops_core.hub_card_purchase_orders_draft": {
                "label": "Borradores",
            },
            "modoops_core.hub_card_purchase_orders_sent": {
                "label": "Enviados al proveedor",
            },
            # Odoo 19: purchase_order_count is non-stored; use purchase_line_ids.
            "modoops_core.hub_card_purchase_vendors_with_po": {
                "domain": "[('purchase_line_ids', '!=', False)]",
                "metric_domain": "[('purchase_line_ids', '!=', False)]",
            },
        }
        for xmlid, values in updates.items():
            card = self.env.ref(xmlid, raise_if_not_found=False)
            if not card:
                continue
            to_write = {
                field: value
                for field, value in values.items()
                if card[field] != value
            }
            if to_write:
                card.write(to_write)

    @api.model
    def setup_accounting_hub_card_accents(self):
        self._setup_hub_card_accents_for_app("accounting")

    @api.model
    def setup_workshop_hub_card_accents(self):
        self._setup_hub_card_accents_for_app("workshop")

    @api.model
    def setup_all_hub_card_accents(self):
        self.setup_inventory_hub_card_accents()
        self.setup_sales_hub_card_accents()
        self.setup_purchase_hub_card_accents()
        self.setup_accounting_hub_card_accents()
        self.setup_workshop_hub_card_accents()

    @api.model
    def get_hub_payload(self, app, section="summary"):
        Section = self.env["mo.hub.section"]
        sections = Section.search([("app", "=", app), ("active", "=", True)])
        cards = self.search([("app", "=", app), ("active", "=", True)], order="sequence, id")

        if section == "summary":
            visible_cards = cards.filtered("show_in_summary")
        else:
            visible_cards = cards.filtered(lambda c: c.section == section)

        metrics_cache = {}
        cards_payload = []
        for card in visible_cards:
            card_ctx = card.with_context(_mo_hub_metrics_cache=metrics_cache)
            cards_payload.append(card_ctx._serialize_card())

        return {
            "app": app,
            "section": section,
            "sections": [
                {
                    "code": s.code,
                    "name": s.name,
                    "icon": s.icon or "fa-circle",
                }
                for s in sections
            ],
            "cards": cards_payload,
        }
