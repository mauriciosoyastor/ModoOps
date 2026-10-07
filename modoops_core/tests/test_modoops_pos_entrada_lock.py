"""Unittest puro: entrada POS consume token atómico (estilo texto, sin Odoo)."""
import unittest
from pathlib import Path

CONTROLLER = Path(__file__).resolve().parents[1] / "controllers" / "pos_entrada.py"


class PosEntradaLockTests(unittest.TestCase):
    def test_token_se_consume_atomico(self):
        text = CONTROLLER.read_text(encoding="utf-8")
        self.assertIn("FOR UPDATE", text)
        self.assertIn("commit", text)

    def test_db_invalida_es_404_no_500(self):
        text = CONTROLLER.read_text(encoding="utf-8")
        self.assertIn("not_found", text)


if __name__ == "__main__":
    unittest.main()
