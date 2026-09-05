"""Unittest puro: retención de Leads (captación propia) sin Odoo."""
import unittest
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

    def test_purge_audits_in_tenant_log(self):
        self.assertIn("modoops.tenant.log", self.raw)

    def test_registered_in_models_init(self):
        init = MODELS_INIT.read_text(encoding="utf-8")
        self.assertIn("modoops_lead", init)


if __name__ == "__main__":
    unittest.main()
