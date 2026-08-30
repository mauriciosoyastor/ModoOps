"""Lógica pura para Herramienta ot.cobro — sin ORM.

Valida y normaliza input para delegar a mo.work.order action_collect_cash.
"""
from __future__ import annotations

from typing import Any

ALLOWED_MEDIUMS = {"cash", "transfer", "card", "other"}


def normalize_input(payload: dict[str, Any]) -> tuple[dict[str, Any] | None, str | None]:
    wid = payload.get("work_order_id")
    if not isinstance(wid, int) or wid <= 0:
        return None, "work_order_id debe ser entero >0"
    amount = payload.get("amount")
    try:
        amt = float(amount)
    except Exception:
        return None, "amount debe ser número"
    if amt <= 0:
        return None, "amount debe ser >0"
    medium = payload.get("medium") or "cash"
    if medium not in ALLOWED_MEDIUMS:
        return None, f"medium debe ser uno de {sorted(ALLOWED_MEDIUMS)}"
    note = (payload.get("note") or "").strip() if payload.get("note") else ""
    return {"work_order_id": wid, "amount": round(amt, 2), "medium": medium, "note": note}, None
