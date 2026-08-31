"""Unittest puro: wizard Catálogo — preview y validación."""
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

WIZARD_VIEWS = Path(__file__).resolve().parents[1] / "views" / "modoops_tenant_install_wizard_views.xml"
WIZARD_MODEL = Path(__file__).resolve().parents[1] / "models" / "modoops_tenant_install_wizard.py"


class WizardModelTests(unittest.TestCase):
    def test_model_has_preview_command(self):
        text = WIZARD_MODEL.read_text(encoding="utf-8")
        self.assertIn("preview_command", text, "wizard missing preview_command field (odoo-bin preview)")

    def test_model_has_catalog_validation(self):
        text = WIZARD_MODEL.read_text(encoding="utf-8")
        # debe validar module_required / CATALOGO_MODOOPS y ya instalado
        self.assertIn("CATALOGO_MODOOPS", text)
        self.assertIn("UserError", text)


class WizardViewTests(unittest.TestCase):
    def setUp(self):
        self.root = ET.parse(WIZARD_VIEWS).getroot()

    def test_view_has_preview_field(self):
        raw = ET.tostring(self.root, encoding="unicode")
        self.assertIn("preview_command", raw, "wizard view missing preview_command field")

    def test_view_has_ancla_addon_help(self):
        raw = ET.tostring(self.root, encoding="unicode")
        self.assertIn("Ancla", raw)
        self.assertIn("Add-on", raw)
        self.assertIn("odoo-bin", raw)

    def test_view_has_module_key_and_action(self):
        raw = ET.tostring(self.root, encoding="unicode")
        self.assertIn("module_key", raw)
        self.assertIn("action", raw)


if __name__ == "__main__":
    unittest.main()
