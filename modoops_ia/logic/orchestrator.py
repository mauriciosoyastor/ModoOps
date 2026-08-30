"""Orquestador BFF — lógica pura (sin Odoo) testeable offline.

Valida auth, suspensión, techo y produce decisión de corrida antes de tocar Odoo.
Inyecta dépendencias para no acoplar a DB real (testeable con fakes).
"""
from __future__ import annotations

from typing import Any, Callable
try:
    from .tool_schemas import validate_tool_input  # package
except ImportError:  # direct
    from tool_schemas import validate_tool_input


def decide(
    *,
    db_name: str,
    tool_name: str,
    payload: dict[str, Any],
    request_id: str,
    api_key: str,
    # inyectables
    validate_api_key: Callable[[str, str], bool],
    is_suspended: Callable[[str], tuple[bool, str | None]],
    is_quota_exceeded: Callable[[str], bool],
    tool_exists: Callable[[str], bool] | None = None,
) -> dict[str, Any]:
    """Retorna dict con `status` y `http` para el BFF."""
    if not db_name or not db_name.startswith("modoops_"):
        return {"http": 400, "status": "error", "error": "db_name inválido"}
    if not request_id:
        return {"http": 400, "status": "error", "error": "requestId requerido"}
    if not validate_api_key(db_name, api_key or ""):
        return {"http": 401, "status": "error", "error": "apiKey inválida"}
    suspended, reason = is_suspended(db_name)
    if suspended:
        return {"http": 403, "status": "error", "error": reason or "Tenant suspendido"}
    if is_quota_exceeded(db_name):
        return {"http": 429, "status": "error", "error": "Techo IA excedido"}

    if tool_exists is not None and not tool_exists(tool_name):
        # falla cerrada — no improvisa
        return {"http": 422, "status": "needs_tool", "error": f"Tool '{tool_name}' no existe en Catálogo"}

    ok, err = validate_tool_input(tool_name, payload or {})
    if not ok:
        return {"http": 422, "status": "error", "error": err}

    # idempotencia se resuelve en DB (modoops.agent.run), aquí solo valida
    return {"http": 200, "status": "ok"}
