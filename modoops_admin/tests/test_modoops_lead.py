"""Unittest puro: retención de Leads (captación propia) sin Odoo."""
import unittest
from datetime import date

from modoops_admin.logic.lead_retention import retention_cutoff, should_purge


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


if __name__ == "__main__":
    unittest.main()
