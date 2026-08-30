"""Unittest puro (sin Odoo) para contrato de Herramientas IA — seam lógica pura."""

import sys
import unittest
from pathlib import Path

LOGIC_DIR = Path(__file__).resolve().parents[1] / "logic"
if str(LOGIC_DIR) not in sys.path:
    sys.path.insert(0, str(LOGIC_DIR))

import tool_schemas as logic  # noqa: E402


class CatalogTests(unittest.TestCase):
    def test_catalog_has_mandatory_tools(self):
        names = logic.catalog_names()
        self.assertIn("echo", names)
        self.assertIn("stock.consulta", names)
        self.assertIn("ot.cobro", names)

    def test_pure_module_has_no_odoo_import(self):
        for py in LOGIC_DIR.glob("*.py"):
            self.assertTrue(logic.is_pure_module(str(py)), f"{py.name} no debe importar odoo")


class ValidateInputTests(unittest.TestCase):
    def test_echo_requires_message(self):
        ok, err = logic.validate_tool_input("echo", {"message": "hola"})
        self.assertTrue(ok)
        ok, err = logic.validate_tool_input("echo", {})
        self.assertFalse(ok)
        self.assertIn("message", err)

    def test_ot_cobro_validates_amount_and_enum(self):
        ok, _ = logic.validate_tool_input("ot.cobro", {"work_order_id": 1, "amount": 100, "medium": "cash"})
        self.assertTrue(ok)
        ok, err = logic.validate_tool_input("ot.cobro", {"work_order_id": 1, "amount": -5})
        self.assertFalse(ok)
        ok, err = logic.validate_tool_input("ot.cobro", {"work_order_id": 1, "amount": 10, "medium": "bitcoin"})
        self.assertFalse(ok)

    def test_unknown_tool(self):
        ok, err = logic.validate_tool_input("no.existe", {})
        self.assertFalse(ok)
        self.assertIn("desconocida", err)


if __name__ == "__main__":
    unittest.main()
