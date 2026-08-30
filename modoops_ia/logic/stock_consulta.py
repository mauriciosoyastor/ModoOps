"""Lógica pura para Herramienta stock.consulta — sin ORM.

Entrada: {product_id, location_id?}
Salida: dict normalizado para wrapper Odoo.
"""
from __future__ import annotations

from typing import Any


def normalize_input(payload: dict[str, Any]) -> tuple[dict[str, Any] | None, str | None]:
    pid = payload.get("product_id")
    if not isinstance(pid, int) or pid <= 0:
        return None, "product_id debe ser entero >0"
    lid = payload.get("location_id")
    if lid is not None and (not isinstance(lid, int) or lid <= 0):
        return None, "location_id debe ser entero >0 si se envía"
    return {"product_id": pid, "location_id": lid}, None


def format_result(product_id: int, qty: float, location_id: int | None = None) -> dict[str, Any]:
    return {"product_id": product_id, "qty": float(qty or 0.0), "location_id": location_id}
