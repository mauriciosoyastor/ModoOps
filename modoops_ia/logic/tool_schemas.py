"""Contrato puro de Herramientas ModoOps IA — sin ORM.

Define el Catálogo vivo (definición en modoops_master) y validadores
que el Orquestador BFF y los wrappers Odoo reutilizan.
"""
from __future__ import annotations

import re
from typing import Any

# Catálogo canónico v0.1 — solo referenciales, ejecución siempre en Tenant.
# Cada entrada mapea a un wrapper Odoo auditado (ver models/modoops_agent_tool.py).
TOOL_CATALOG: list[dict[str, Any]] = [
    {
        "name": "echo",
        "label": "Echo (dummy para Orquestador)",
        "input_schema": {"type": "object", "properties": {"message": {"type": "string"}}, "required": ["message"]},
        "groups_id": False,  # abierto para healthcheck del BFF
        "module_required": False,
        "kind": "read",
    },
    {
        "name": "stock.consulta",
        "label": "Consultar stock por producto",
        "input_schema": {
            "type": "object",
            "properties": {"product_id": {"type": "integer"}, "location_id": {"type": "integer"}},
            "required": ["product_id"],
        },
        "groups_id": "stock.group_stock_user",
        "module_required": "stock",
        "kind": "read",
    },
    {
        "name": "ot.cobro",
        "label": "Cobro de OT en caja",
        "input_schema": {
            "type": "object",
            "properties": {
                "work_order_id": {"type": "integer"},
                "amount": {"type": "number", "minimum": 0.01},
                "medium": {"type": "string", "enum": ["cash", "transfer", "card", "other"]},
            },
            "required": ["work_order_id", "amount"],
        },
        "groups_id": "base.group_user",
        "module_required": "modoops_core",
        "kind": "write",
    },
]

CATALOG_BY_NAME = {t["name"]: t for t in TOOL_CATALOG}
_SLUG_RE = re.compile(r"^[a-z0-9]+(?:[._][a-z0-9]+)*$")


def is_pure_module(filepath: str) -> bool:
    """Heurística offline: un archivo de logic/ no debe importar Odoo (ignora strings)."""
    try:
        with open(filepath, encoding="utf-8") as f:
            text = f.read()
    except Exception:
        return False
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("from " + "odoo") or stripped.startswith("import " + "odoo"):
            return False
    return True


def validate_tool_input(tool_name: str, payload: dict[str, Any]) -> tuple[bool, str | None]:
    """Validador puro de input_schema (subset)."""
    tool = CATALOG_BY_NAME.get(tool_name)
    if not tool:
        return False, f"Tool desconocida '{tool_name}'"
    if not _SLUG_RE.match(tool_name):
        return False, "Nombre de tool inválido"
    schema = tool.get("input_schema") or {}
    required = schema.get("required") or []
    props = schema.get("properties") or {}
    for field in required:
        if field not in payload:
            return False, f"Falta campo requerido '{field}'"
    for key, value in payload.items():
        prop = props.get(key)
        if not prop:
            continue
        t = prop.get("type")
        if t == "integer" and not isinstance(value, int):
            return False, f"Campo '{key}' debe ser entero"
        if t == "number" and not isinstance(value, (int, float)):
            return False, f"Campo '{key}' debe ser número"
        if t == "string" and not isinstance(value, str):
            return False, f"Campo '{key}' debe ser texto"
        if "enum" in prop and value not in prop["enum"]:
            return False, f"Campo '{key}' fuera de enum"
        if "minimum" in prop and isinstance(value, (int, float)) and value < prop["minimum"]:
            return False, f"Campo '{key}' por debajo del mínimo"
    return True, None


def catalog_names() -> list[str]:
    return sorted(CATALOG_BY_NAME.keys())
