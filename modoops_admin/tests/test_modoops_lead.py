"""Unittest puro: retención de Leads (captación propia) sin Odoo."""
import unittest
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

from modoops_admin.logic.lead_retention import retention_cutoff, should_purge

ADMIN = Path(__file__).resolve().parents[1]
LEAD_MODEL = ADMIN / "models" / "modoops_lead.py"
MODELS_INIT = ADMIN / "models" / "__init__.py"


class RetentionCutoffTests(unittest.TestCase):
    def test_cutoff_is_today_minus_90(self):
        self.assertEqual(retention_cutoff(date(2026, 9, 5)), date(2026, 6, 7))

    def test_cutoff_custom_days(self):
        self.assertEqual(retention_cutoff(date(2026, 9, 5), days=30), date(2026, 8, 6))


class ShouldPurgeTests(unittest.TestCase):
    TODAY = date(2026, 9, 5)

    def test_expired_purges(self):
        self.assertTrue(should_purge(date(2026, 6, 6), opt_out=False, today=self.TODAY))

    def test_exactly_90_days_keeps(self):
        # spec: vencidos son >90 días; el día 90 aún se conserva
        self.assertFalse(should_purge(date(2026, 6, 7), opt_out=False, today=self.TODAY))

    def test_fresh_keeps(self):
        self.assertFalse(should_purge(date(2026, 9, 1), opt_out=False, today=self.TODAY))

    def test_no_date_keeps(self):
        self.assertFalse(should_purge(None, opt_out=False, today=self.TODAY))

    def test_opt_out_purges_immediately(self):
        self.assertTrue(should_purge(date(2026, 9, 1), opt_out=True, today=self.TODAY))
        self.assertTrue(should_purge(None, opt_out=True, today=self.TODAY))


class LeadModelFileTests(unittest.TestCase):
    FIELDS = [
        "nombre", "direccion", "telefono", "email", "web", "categoria",
        "rating", "lat", "lon", "place_id", "fuente", "fecha_captura", "estado",
    ]

    def setUp(self):
        self.raw = LEAD_MODEL.read_text(encoding="utf-8")

    def test_model_name(self):
        self.assertIn('"modoops.lead"', self.raw)

    def test_fields_present(self):
        for field in self.FIELDS:
            self.assertIn(field, self.raw, f"campo {field} ausente en modoops.lead")

    def test_purge_and_opt_out_methods(self):
        self.assertIn("def purge_expired_leads", self.raw)
        self.assertIn("def action_opt_out", self.raw)
        self.assertIn("ensure_one", self.raw)

    def test_opt_out_logs_no_pii(self):
        self.assertNotIn("self.nombre", self.raw)

    def test_purge_audits_in_tenant_log(self):
        self.assertIn("modoops.tenant.log", self.raw)

    def test_registered_in_models_init(self):
        init = MODELS_INIT.read_text(encoding="utf-8")
        self.assertIn("modoops_lead", init)


LEAD_CRON = ADMIN / "data" / "modoops_lead_cron.xml"
MANIFEST = ADMIN / "__manifest__.py"
ACCESS_CSV = ADMIN / "security" / "ir.model.access.csv"


class LeadCronManifestAccessTests(unittest.TestCase):
    def test_cron_calls_purge(self):
        raw = LEAD_CRON.read_text(encoding="utf-8")
        self.assertIn("model_modoops_lead", raw)
        self.assertIn("purge_expired_leads", raw)

    def test_manifest_lists_cron(self):
        self.assertIn("modoops_lead_cron.xml", MANIFEST.read_text(encoding="utf-8"))

    def test_access_restricted_to_system(self):
        text = ACCESS_CSV.read_text(encoding="utf-8")
        self.assertIn("modoops.lead", text)
        self.assertIn("base.group_system", text)
        self.assertNotIn("base.group_user", text)


LEAD_VIEWS = ADMIN / "views" / "modoops_lead_views.xml"


class LeadViewsTests(unittest.TestCase):
    def setUp(self):
        self.root = ET.parse(LEAD_VIEWS).getroot()
        self.raw = ET.tostring(self.root, encoding="unicode")

    def test_list_shows_key_fields(self):
        for field in ("nombre", "telefono", "estado", "fecha_captura"):
            self.assertIn(field, self.raw)

    def test_action_and_menu_registered(self):
        self.assertIn("modoops.lead", self.raw)
        self.assertIn("menuitem", self.raw)
        self.assertIn("menu_modoops_admin", self.raw)


if __name__ == "__main__":
    unittest.main()
