"""Ticket 10 — delta % puro del hub Resumen (sin Odoo a propósito).

El mixin (`metric_mixin.py`) envuelve estas funciones con
`search_count`/`read_group`: acá solo vive matemática de fechas y
porcentajes, testeable en pytest local sin entorno Odoo.
"""

from datetime import date


def pct_change(current, previous):
    """(ahora - antes) / antes * 100. None = sin antes: no inventar %."""
    if current is None or previous is None or previous == 0:
        return None
    return ((current - previous) / previous) * 100


def shift_period_back(start, end):
    """Mismo largo, período inmediato anterior: [inicio-fin) → previo.

    Hoy [22, 23) → [21, 22) (ayer). Semana [22, 29) → [15, 22).
    """
    if not isinstance(start, date) or not isinstance(end, date):
        return (None, None)
    length = end - start
    return (start - length, start)


def delta_ref(scope):
    """Referencia ES-AR del período previo. None = stock sin flujo (sin delta).

    due_week cubre hoy..hoy+7 (8 días calendario, ver _metric_domain_resolved):
    la copia dice "semana previa" sin número para no mentir por uno.
    """
    return {
        "today": "vs ayer",
        "due_today": "vs ayer",
        "due_week": "vs semana previa",
    }.get(scope)
