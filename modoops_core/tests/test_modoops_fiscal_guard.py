"""Unittest puro: guard fiscal AR sin Odoo (stubs mínimos, script-run).

_is_fiscal_enabled lee ir.config_parameter; action_post bloquea
out_invoice/out_refund de diario sale salvo flag on.
"""
import importlib.util
import sys
import unittest
from pathlib import Path


def _stub_odoo():
    import types

    odoo = types.ModuleType("odoo")

    class Model:
        def __init__(self, *a, **k):
            pass

        def action_post(self):
            return "posted-super"

    class TransientModel(Model):
        pass

    class _Api:
        @staticmethod
        def model(f):
            return f

    class UserError(Exception):
        pass

    odoo.api = _Api()
    odoo.models = types.SimpleNamespace(Model=Model, TransientModel=TransientModel)
    odoo.exceptions = types.SimpleNamespace(UserError=UserError)
    odoo._ = lambda s: s
    odoo.SUPERUSER_ID = 1
    sys.modules.setdefault("odoo", odoo)
    sys.modules.setdefault("odoo.exceptions", odoo.exceptions)
    return UserError


_UserError = _stub_odoo()

GUARD = Path(__file__).resolve().parents[1] / "models" / "modoops_fiscal_guard.py"
_spec = importlib.util.spec_from_file_location("modoops_fiscal_guard", GUARD)
guard = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(guard)


class FakeICP:
    def __init__(self, params):
        self.params = params

    def sudo(self):
        return self

    def get_param(self, key, default="False"):
        return self.params.get(key, default)


class FakeEnv(dict):
    pass


class FakeJournal:
    def __init__(self, type):
        self.type = type


class FakeMove:
    def __init__(self, move_type, journal_type):
        self.move_type = move_type
        self.journal_id = FakeJournal(journal_type)


def make_guard(params, moves):
    class TestGuard(guard.AccountMoveFiscalGuard):
        def __iter__(self):
            return iter(self._moves)

    g = TestGuard()
    g.env = FakeEnv({"ir.config_parameter": FakeICP(params)})
    g._moves = moves
    return g


class FiscalGuardTests(unittest.TestCase):
    def test_flag_off_por_defecto_bloquea_venta(self):
        g = make_guard({}, [FakeMove("out_invoice", "sale")])
        with self.assertRaises(_UserError):
            g.action_post()

    def test_flag_on_permite_post(self):
        g = make_guard({"modoops.fiscal_enabled": "1"}, [FakeMove("out_invoice", "sale")])
        self.assertEqual(g.action_post(), "posted-super")

    def test_flag_true_case_insensitive(self):
        g = make_guard({"modoops.fiscal_enabled": "True"}, [FakeMove("out_refund", "sale")])
        self.assertEqual(g.action_post(), "posted-super")

    def test_no_bloquea_compra_ni_diario_no_sale(self):
        g = make_guard({}, [FakeMove("in_invoice", "purchase")])
        self.assertEqual(g.action_post(), "posted-super")
        g = make_guard({}, [FakeMove("out_invoice", "purchase")])
        self.assertEqual(g.action_post(), "posted-super")

    def test_is_fiscal_enabled_parse(self):
        env = FakeEnv({"ir.config_parameter": FakeICP({"modoops.fiscal_enabled": "yes"})})
        self.assertTrue(guard._is_fiscal_enabled(env))
        env = FakeEnv({"ir.config_parameter": FakeICP({})})
        self.assertFalse(guard._is_fiscal_enabled(env))


if __name__ == "__main__":
    unittest.main()
