"""Lógica pura ModoOps IA — sin Odoo, testeable offline."""
from .tool_schemas import (
    TOOL_CATALOG,
    validate_tool_input,
    is_pure_module,
)
from .orchestrator import decide as orchestrator_decide
from .stock_consulta import normalize_input as stock_normalize, format_result as stock_format
from .ot_cobro import normalize_input as ot_normalize
from .memory import encrypt_value, decrypt_value, should_purge
