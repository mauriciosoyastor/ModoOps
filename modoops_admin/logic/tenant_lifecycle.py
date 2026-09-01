"""TenantLifecycle puro con Clock inyectado — sin Odoo, sin context_today.

Todas las decisiones son funciones puras (date, state) -> error_msg | None.
El wrapper Odoo traduce None/err a UserError.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Protocol


class Clock(Protocol):
    def today(self) -> date: ...


@dataclass(frozen=True)
class SystemClock:
    def today(self) -> date:
        return date.today()


@dataclass(frozen=True)
class FixedClock:
    fixed: date

    def today(self) -> date:
        return self.fixed


def suspend_grace_until(abono_due_date: date | None) -> date | None:
    if not abono_due_date:
        return None
    return abono_due_date + timedelta(days=7)


def baja_earliest(abono_due_date: date | None) -> date | None:
    if not abono_due_date:
        return None
    return abono_due_date + timedelta(days=15)


def can_suspend(state: str, today: date, grace_until: date | None) -> str | None:
    if state == "baja":
        return "Tenant en Baja no se puede suspender. Restaurá desde backup."
    if state == "suspendido":
        return "Tenant ya está Suspendido."
    if grace_until and today < grace_until:
        delta = (grace_until - today).days
        return f"Gracia activa hasta {grace_until} — faltan {delta} días. Avisar por WhatsApp antes de suspender (CONTEXT.md gracia 7 días)."
    return None


def can_reactivate(state: str) -> str | None:
    if state != "suspendido":
        return "Solo se reactiva un Suspendido."
    return None


def can_mark_baja(state: str, today: date, abono_due_date: date | None) -> str | None:
    if state != "suspendido":
        return "Solo un Suspendido puede pasar a Baja (día 15, tras backup final)."
    earliest = baja_earliest(abono_due_date)
    if earliest and today < earliest:
        return "Baja solo desde día 15 de mora (backup final). Hoy faltan días."
    return None
