"""Unittest puro: logs export + provisioning banner."""
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

LOG_VIEWS = Path(__file__).resolve().parents[1] / "views" / "modoops_tenant_log_views.xml"
LOG_MODEL = Path(__file__).resolve().parents[1] / "models" / "modoops_tenant_log.py"
ACCESS_CSV = Path(__file__).resolve().parents[1] / "security" / "ir.model.access.csv"


class LogModelExportTests(unittest.TestCase):
    def test_model_has_export_method(self):
        text = LOG_MODEL.read_text(encoding="utf-8")
        self.assertIn("export", text.lower(), "log model missing export method")
        self.assertIn("csv", text.lower(), "log model missing csv handling")

    def test_access_restricted_to_system(self):
        text = ACCESS_CSV.read_text(encoding="utf-8")
        # solo base.group_system debe tener acceso a modoops.tenant y modoops.tenant.log
        self.assertIn("base.group_system", text)
        # no debe haber acceso para base.group_user
        self.assertNotIn("base.group_user", text)


class LogViewExportTests(unittest.TestCase):
    def setUp(self):
        self.root = ET.parse(LOG_VIEWS).getroot()
        self.raw = ET.tostring(self.root, encoding="unicode")

    def test_log_list_has_export_button_or_action(self):
        # debe haber botón/action export CSV en la vista o control panel
        self.assertTrue(
            "export" in self.raw.lower() and "csv" in self.raw.lower(),
            "log view missing export CSV button/action",
        )

    def test_log_search_has_tenant_action_filter(self):
        self.assertIn("tenant_id", self.raw)
        self.assertIn("action", self.raw)

    def test_log_view_has_badge_and_help(self):
        self.assertIn("widget=\"badge\"", self.raw)
        self.assertIn("Provisioning", self.raw)


if __name__ == "__main__":
    unittest.main()
