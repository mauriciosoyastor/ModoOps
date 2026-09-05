"""Retención de Leads (captación propia) — lógica pura, sin Odoo.

Regla #90: purga automática a los 90 días de captura + supresión
inmediata ante opt-out. Sin fecha de captura no se purga por antigüedad.
"""
from __future__ import annotations

from datetime import date, timedelta

RETENTION_DAYS = 90


def retention_cutoff(today: date, days: int = RETENTION_DAYS) -> date:
    return today - timedelta(days=days)


def should_purge(
    fecha_captura: date | None,
    *,
    opt_out: bool,
    today: date,
    days: int = RETENTION_DAYS,
) -> bool:
    if opt_out:
        return True
    if fecha_captura is None:
        return False
    return fecha_captura < retention_cutoff(today, days)
