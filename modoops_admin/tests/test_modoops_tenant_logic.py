"""Unittest puro: lógica Control Plane sin Odoo."""
import unittest
from datetime import date, timedelta


# helpers mirrors model logic without importing Odoo

def compute_suspend_grace_until(abono_due_date):
    if not abono_due_date:
        return None
    return abono_due_date + timedelta(days=7)


def modules_installed_count(modules_installed_text):
    if not modules_installed_text:
        return 0
    parts = [s.strip() for s in modules_installed_text.split(",") if s.strip()]
    return len(parts)


def grace_days_left(abono_due_date, today):
    grace = compute_suspend_grace_until(abono_due_date)
    if not grace:
        return None
    return (grace - today).days


class GraceTests(unittest.TestCase):
    def test_grace_is_due_plus_7(self):
        d = date(2026, 9, 23)
        self.assertEqual(compute_suspend_grace_until(d), date(2026, 9, 30))

    def test_grace_none_when_no_due(self):
        self.assertIsNone(compute_suspend_grace_until(None))

    def test_grace_days_left_positive(self):
        due = date(2026, 9, 23)
        today = date(2026, 9, 24)
        self.assertEqual(grace_days_left(due, today), 6)

    def test_grace_days_left_negative_when_past(self):
        due = date(2026, 9, 23)
        today = date(2026, 10, 2)
        self.assertEqual(grace_days_left(due, today), -2)


class ModulesCountTests(unittest.TestCase):
    def test_empty_is_zero(self):
        self.assertEqual(modules_installed_count(None), 0)
        self.assertEqual(modules_installed_count(""), 0)
        self.assertEqual(modules_installed_count("   "), 0)

    def test_single(self):
        self.assertEqual(modules_installed_count("Mostrador"), 1)

    def test_three(self):
        self.assertEqual(modules_installed_count("Mostrador, Depósito Inteligente, Fiscal AR"), 3)

    def test_trims_spaces_and_empty(self):
        self.assertEqual(modules_installed_count("Mostrador, , Depósito , "), 2)


class SlugValidationTests(unittest.TestCase):
    def test_slug_regex(self):
        import re

        SLUG_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*$")
        DB_PREFIX = "modoops_"
        self.assertTrue(SLUG_RE.match("pintureria_centro"))
        self.assertFalse(SLUG_RE.match("Pintureria-Centro"))
        self.assertTrue("modoops_pintureria_centro".startswith(DB_PREFIX))


if __name__ == "__main__":
    unittest.main()
