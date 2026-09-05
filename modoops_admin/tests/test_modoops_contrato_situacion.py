"""Unittest puro: situacion de contrato por tenant sin Odoo."""
import unittest
from datetime import date
from pathlib import Path
import importlib.util


def _load():
    path = Path(__file__).resolve().parents[1] / "logic" / "contrato_situacion.py"
    spec = importlib.util.spec_from_file_location("contrato_situacion", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


mod = _load()


class SituacionTests(unittest.TestCase):
    def test_sin_contrato(self):
        sem, _ = mod.situacion_contrato(contrato_state=None, today=date(2026, 9, 3))
        self.assertEqual(sem, "sin_contrato")

    def test_en_implementacion_sin_hito2(self):
        sem, _ = mod.situacion_contrato(
            contrato_state="vigente", hito2_ok=False, saldo_cobrado=False, today=date(2026, 9, 3)
        )
        self.assertEqual(sem, "en_implementacion")

    def test_listo_cobrar_saldo(self):
        sem, _ = mod.situacion_contrato(
            contrato_state="vigente", hito2_ok=True, saldo_cobrado=False, today=date(2026, 9, 3)
        )
        self.assertEqual(sem, "listo_cobrar_saldo")

    def test_hipercare(self):
        sem, _ = mod.situacion_contrato(
            contrato_state="vigente", hito2_ok=True, saldo_cobrado=True,
            go_live_date=date(2026, 9, 1), today=date(2026, 9, 3),
        )
        self.assertEqual(sem, "en_hipercare")

    def test_al_dia_gracia_suspendible(self):
        self.assertEqual(
            mod.situacion_contrato(
                contrato_state="vigente", hito2_ok=True, saldo_cobrado=True,
                go_live_date=date(2026, 8, 1), abono_due_date=date(2026, 9, 10),
                today=date(2026, 9, 3),
            )[0], "al_dia")
        self.assertEqual(
            mod.situacion_contrato(
                contrato_state="vigente", hito2_ok=True, saldo_cobrado=True,
                go_live_date=date(2026, 8, 1), abono_due_date=date(2026, 9, 10),
                today=date(2026, 9, 12),
            )[0], "en_gracia")
        self.assertEqual(
            mod.situacion_contrato(
                contrato_state="vigente", hito2_ok=True, saldo_cobrado=True,
                go_live_date=date(2026, 8, 1), abono_due_date=date(2026, 9, 10),
                today=date(2026, 9, 20),
            )[0], "suspendible")

    def test_suspendido_espeja_tenant(self):
        sem, _ = mod.situacion_contrato(
            tenant_state="suspendido", contrato_state="vigente",
            hito2_ok=True, saldo_cobrado=True, today=date(2026, 9, 3))
        self.assertEqual(sem, "suspendido")


if __name__ == "__main__":
    unittest.main()
