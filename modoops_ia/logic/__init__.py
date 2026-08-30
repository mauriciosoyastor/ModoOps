"""Lógica pura ModoOps IA — sin Odoo, testeable offline.

Public surface of modoops_ia.logic. Feature branches must EXTEND this
module (add imports), never replace it with a stub — that causes add/add
merge conflicts against main.
"""
from .tool_schemas import (
    TOOL_CATALOG,
    validate_tool_input,
    is_pure_module,
)
from .orchestrator import decide as orchestrator_decide
from .stock_consulta import normalize_input as stock_normalize, format_result as stock_format
from .ot_cobro import normalize_input as ot_normalize
from .memory import encrypt_value, decrypt_value, should_purge

__all__ = [
    "TOOL_CATALOG",
    "validate_tool_input",
    "is_pure_module",
    "orchestrator_decide",
    "stock_normalize",
    "stock_format",
    "ot_normalize",
    "encrypt_value",
    "decrypt_value",
    "should_purge",
]
