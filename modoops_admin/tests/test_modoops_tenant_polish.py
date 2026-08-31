"""Unittest puro: polish kanban + CSV attachment."""
import unittest
from pathlib import Path
import xml.etree.ElementTree as ET

WIZARD_VIEWS = Path(__file__).resolve().parents[1] / "views" / "modoops_tenant_install_wizard_views.xml"
LOG_MODEL = Path(__file__).resolve().parents[1] / "models" / "modoops_tenant_log.py"


class WizardKanbanTests(unittest.TestCase):
    def test_wizard_has_kanban_view_for_lines(self):
        raw = ET.tostring(ET.parse(WIZARD_VIEWS).getroot(), encoding="unicode")
        # kanban view para line_ids cards Ancla/Add-on
        self.assertIn("kanban", raw.lower())
        self.assertIn("modoops.tenant.install.wizard.line", raw)

    def test_wizard_view_uses_kanban_or_list_with_cards(self):
        raw = ET.tostring(ET.parse(WIZARD_VIEWS).getroot(), encoding="unicode")
        # debe mencionar Ancla/Add-on y badge en kanban/list
        self.assertIn("Ancla", raw)
        self.assertIn("Add-on", raw)


class LogCsvAttachmentTests(unittest.TestCase):
    def test_log_model_creates_attachment(self):
        text = LOG_MODEL.read_text(encoding="utf-8")
        self.assertIn("ir.attachment", text)
        self.assertIn("act_url", text.lower() + "act_url".lower() if "act_url" in text.lower() else "")

    def test_log_model_has_csv_writer(self):
        text = LOG_MODEL.read_text(encoding="utf-8")
        self.assertIn("csv.writer", text)
        self.assertIn("base64", text.lower())


if __name__ == "__main__":
    unittest.main()
