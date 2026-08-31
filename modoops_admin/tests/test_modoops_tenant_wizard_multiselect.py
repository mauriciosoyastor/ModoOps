"""Unittest puro: wizard multi-select batch."""
import unittest
from pathlib import Path
import xml.etree.ElementTree as ET

WIZARD_MODEL = Path(__file__).resolve().parents[1] / "models" / "modoops_tenant_install_wizard.py"
WIZARD_VIEWS = Path(__file__).resolve().parents[1] / "views" / "modoops_tenant_install_wizard_views.xml"


class WizardMultiSelectModelTests(unittest.TestCase):
    def test_model_has_line_ids_one2many(self):
        text = WIZARD_MODEL.read_text(encoding="utf-8")
        self.assertIn("line_ids", text)
        self.assertIn("One2many", text)
        self.assertIn("modoops.tenant.install.wizard.line", text)

    def test_model_has_wizard_line_class(self):
        text = WIZARD_MODEL.read_text(encoding="utf-8")
        self.assertIn("class ModoopsTenantInstallWizardLine", text)
        self.assertIn("wizard_id", text)

    def test_model_action_confirm_handles_batch(self):
        text = WIZARD_MODEL.read_text(encoding="utf-8")
        # debe iterar line_ids si existen
        self.assertIn("line_ids", text)
        self.assertIn("for line in", text)


class WizardMultiSelectViewTests(unittest.TestCase):
    def test_view_has_one2many_field(self):
        raw = ET.tostring(ET.parse(WIZARD_VIEWS).getroot(), encoding="unicode")
        self.assertIn("line_ids", raw)

    def test_view_has_cards_help(self):
        raw = ET.tostring(ET.parse(WIZARD_VIEWS).getroot(), encoding="unicode")
        self.assertIn("Ancla", raw)
        self.assertIn("Add-on", raw)


if __name__ == "__main__":
    unittest.main()
