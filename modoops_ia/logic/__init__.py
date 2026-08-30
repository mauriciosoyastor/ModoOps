"""Lógica pura ModoOps IA — sin Odoo, testeable offline."""
from .tool_schemas import (
    TOOL_CATALOG,
    validate_tool_input,
    is_pure_module,
)
from .orchestrator import decide as orchestrator_decide
