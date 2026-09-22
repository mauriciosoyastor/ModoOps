"""MetricMixin — deduplica mo_hub_card / mo_app_tile.

Abstract Model con campos métrica + helpers _eval_domain/_format_metric_value/_compute_metric_raw.
Cada subclass elige su cache_key overrideando _metric_cache_key.
"""

import logging
from datetime import timedelta

from odoo import fields, models
from odoo.tools.safe_eval import safe_eval

from ..hub_delta import shift_period_back as _shift_period_back

_logger = logging.getLogger(__name__)


class MetricMixin(models.AbstractModel):
    _name = "mo.metric.mixin"
    _description = "Mixin métrica count/sum con dominio + fecha"

    metric_model = fields.Char(string="Modelo métrica")
    metric_domain = fields.Char(string="Dominio métrica", default="[]")
    metric_field = fields.Char(string="Campo métrica", help="Vacío para conteo. Para suma, nombre del campo numérico.")
    metric_aggregate = fields.Selection([("count", "Conteo"), ("sum", "Suma")], default="count")
    metric_suffix = fields.Char(string="Sufijo valor", help="Ej: $, u., %")
    metric_date_field = fields.Char(string="Campo fecha métrica", help="Ej: date_order. Usar con alcance de fecha.")
    metric_date_scope = fields.Selection(
        [
            ("none", "Sin filtro fecha"),
            ("today", "Hoy"),
            ("due_today", "Vence hoy"),
            ("due_week", "Vence esta semana"),
            ("overdue", "Vencidas"),
        ],
        string="Alcance fecha métrica",
        default="none",
    )

    # subclasses override
    _metric_cache_key = "_mo_metrics_cache"

    def _eval_domain(self, domain_str):
        if not domain_str:
            return []
        try:
            return safe_eval(domain_str)
        except Exception:
            _logger.warning("Dominio inválido en %s %s: %s", self._name, self.id, domain_str)
            return []

    def _metric_domain_resolved(self):
        self.ensure_one()
        domain = list(self._eval_domain(self.metric_domain))
        if not self.metric_date_field or self.metric_date_scope in (False, "none"):
            return domain
        today = fields.Date.context_today(self)
        field = self.metric_date_field
        if self.metric_date_scope == "today":
            tomorrow = today + timedelta(days=1)
            domain.extend([(field, ">=", today), (field, "<", tomorrow)])
        elif self.metric_date_scope == "due_today":
            domain.append((field, "=", today))
        elif self.metric_date_scope == "due_week":
            week_end = today + timedelta(days=7)
            domain.extend([(field, ">=", today), (field, "<=", week_end)])
        elif self.metric_date_scope == "overdue":
            domain.append((field, "<", today))
        return domain

    def _format_metric_value(self, raw_value):
        self.ensure_one()
        if raw_value is None:
            return "—"
        if isinstance(raw_value, float):
            if raw_value == int(raw_value):
                formatted = f"{int(raw_value):,}".replace(",", ".")
            else:
                formatted = f"{raw_value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        else:
            formatted = f"{raw_value:,}".replace(",", ".")
        if self.metric_suffix:
            return f"{formatted}{self.metric_suffix}"
        return formatted

    def _compute_metric_raw(self):
        self.ensure_one()
        if not self.metric_model or self.metric_model not in self.env:
            return None
        Model = self.env[self.metric_model]
        domain = self._metric_domain_resolved()
        try:
            if self.metric_aggregate == "sum" and self.metric_field:
                data = Model.read_group(domain, [self.metric_field], [])
                if not data:
                    return 0
                return data[0].get(self.metric_field) or 0
            return Model.search_count(domain)
        except Exception:
            _logger.exception("Error calculando métrica para %s %s", self._name, self.id)
            return None

    def _metric_current_bounds(self):
        """(inicio, fin) semiabierto del período actual según scope, o (None, None).

        Solo scopes de flujo tienen "período anterior" (ticket 10, regla mismo
        largo): today/due_today → el día; due_week → 7 días. none/overdue son
        stock acumulado → sin delta.
        """
        self.ensure_one()
        if not self.metric_date_field or self.metric_date_scope in (
            False,
            "none",
            "overdue",
        ):
            return (None, None)
        today = fields.Date.context_today(self)
        if self.metric_date_scope in ("today", "due_today"):
            return (today, today + timedelta(days=1))
        if self.metric_date_scope == "due_week":
            return (today, today + timedelta(days=8))
        return (None, None)

    def _compute_metric_previous(self):
        """Mismo cálculo que el actual pero en el período inmediato anterior."""
        self.ensure_one()
        start, end = self._metric_current_bounds()
        if start is None or not self.metric_model or self.metric_model not in self.env:
            return None
        prev_start, prev_end = _shift_period_back(start, end)
        Model = self.env[self.metric_model]
        domain = list(self._eval_domain(self.metric_domain))
        date_field = self.metric_date_field
        domain.extend([(date_field, ">=", prev_start), (date_field, "<", prev_end)])
        try:
            if self.metric_aggregate == "sum" and self.metric_field:
                data = Model.read_group(domain, [self.metric_field], [])
                if not data:
                    return 0
                return data[0].get(self.metric_field) or 0
            return Model.search_count(domain)
        except Exception:
            _logger.exception(
                "Error calculando métrica previa para %s %s", self._name, self.id
            )
            return None

    def _get_metric_display(self):
        self.ensure_one()
        cache = self.env.context.get(self._metric_cache_key)
        if cache is not None and self.id in cache:
            return cache[self.id]
        display = self._format_metric_value(self._compute_metric_raw())
        if cache is not None:
            cache[self.id] = display
        return display
