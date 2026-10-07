"""Despacho puro de herramientas del Agente — sin ORM (testeable sin Odoo).

El wrapper Odoo (`models/modoops_agent_run.py::execute`) valida permisos y
acceso a datos; aquí vive lo serializable: catálogo soportado, envelopes y
JSON de filas. El controller (`controllers/agent_execute.py`) valida apiKey.
"""
from __future__ import annotations

import json
from typing import Any

SUPPORTED_TOOLS = ("echo", "stock.consulta", "ot.cobro")


def is_supported(tool_name: str | None) -> bool:
    return tool_name in SUPPORTED_TOOLS


def run_id(tenant_db: str, tool_name: str, request_id: str) -> str:
    return f"{tenant_db}:{tool_name}:{request_id}"


def serialize_payload(payload: Any) -> str:
    return json.dumps(payload if payload is not None else {}, sort_keys=True, default=str)


def deserialize_payload(raw: Any) -> Any:
    if not raw:
        return {}
    if isinstance(raw, dict):
        return raw
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return {}


def ok_envelope(tenant_db: str, tool_name: str, request_id: str, output: Any, replayed: bool = False) -> dict:
    return {
        "status": "ok",
        "output": output if output is not None else {},
        "runId": run_id(tenant_db, tool_name, request_id),
        "replayed": bool(replayed),
    }


def error_envelope(
    tenant_db: str,
    tool_name: str,
    request_id: str,
    code: str,
    error: str,
    status: str = "error",
) -> dict:
    return {
        "status": status,
        "code": code,
        "error": error or "",
        "runId": run_id(tenant_db, tool_name, request_id),
    }
