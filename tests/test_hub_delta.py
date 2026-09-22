"""Ticket 10 — delta % puro del hub (sin Odoo: corre en pytest local).

Ubicación a propósito fuera del paquete `modoops_core` (su `__init__`
encadena a Odoo): la implementación se carga por ruta de archivo y el
mixin Odoo la importa relativo (`from .hub_delta import ...`).
"""
from datetime import date
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

_spec = spec_from_file_location(
    "hub_delta",
    Path(__file__).parent.parent / "modoops_core" / "models" / "hub_delta.py",
)
_hub_delta = module_from_spec(_spec)
_spec.loader.exec_module(_hub_delta)

delta_ref = _hub_delta.delta_ref
pct_change = _hub_delta.pct_change
shift_period_back = _hub_delta.shift_period_back


def test_pct_change_como_ahora_menos_antes_sobre_antes():
    assert pct_change(100, 80) == 25.0
    assert pct_change(80, 100) == -20.0


def test_pct_change_sin_antes_da_none_no_inventa():
    assert pct_change(100, 0) is None
    assert pct_change(100, None) is None
    assert pct_change(None, 80) is None


def test_shift_period_back_mismo_largo_inmediato_anterior_hoy():
    assert shift_period_back(date(2026, 9, 22), date(2026, 9, 23)) == (
        date(2026, 9, 21),
        date(2026, 9, 22),
    )


def test_shift_period_back_mismo_largo_inmediato_anterior_semana():
    # due_week vigente: hoy..hoy+7 (8 días). El previo espeja el largo real.
    assert shift_period_back(date(2026, 9, 22), date(2026, 9, 30)) == (
        date(2026, 9, 14),
        date(2026, 9, 22),
    )


def test_delta_ref_solo_scopes_de_flujo():
    assert delta_ref("today") == "vs ayer"
    assert delta_ref("due_today") == "vs ayer"
    assert delta_ref("due_week") == "vs semana previa"
    assert delta_ref("overdue") is None
    assert delta_ref("none") is None
