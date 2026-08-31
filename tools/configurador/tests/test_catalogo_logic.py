"""TDD seam logic pura — Catálogo single-source."""

import json
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
CATALOGO = REPO / "tools" / "configurador" / "catalogo.json"


class CatalogoTests(unittest.TestCase):
    def test_catalogo_exists_and_valid(self):
        self.assertTrue(CATALOGO.exists(), f"catalogo.json no existe en {CATALOGO}")
        data = json.loads(CATALOGO.read_text(encoding="utf-8"))
        self.assertIn("modules", data)
        self.assertIn("pricing", data)
        self.assertIn("capacity", data)

    def test_modulos_validados(self):
        data = json.loads(CATALOGO.read_text(encoding="utf-8"))
        mods = data["modules"]
        # 8 validados según spec #46 + mapa
        for key in ["mostrador", "deposito", "ventas", "compras", "fiscal_ar", "contactos", "plataforma", "puente_factura"]:
            self.assertIn(key, mods, f"falta módulo {key}")
            self.assertIn("modoops", mods[key])
            self.assertIn("odoo", mods[key])
        # ancla_retail flag
        self.assertTrue(mods["mostrador"]["ancla_retail"])
        self.assertTrue(mods["deposito"]["ancla_retail"])

    def test_pricing_completo(self):
        data = json.loads(CATALOGO.read_text(encoding="utf-8"))
        p = data["pricing"]
        self.assertEqual(p["tarifa_diaria"], 52)
        self.assertEqual(p["descubrimiento"]["amount"], 155)
        self.assertEqual(p["descubrimiento"]["credito"], 77.5)
        self.assertEqual(p["ancla"]["amount"], 800)
        self.assertEqual(p["ancla"]["techo_horas"], 92)
        self.assertEqual(p["ancla"]["techo_ajustes"], 8)
        self.assertEqual(p["ancla"]["validez_dias"], 20)
        self.assertEqual(p["abono"]["amount"], 45)
        self.assertEqual(p["tarifa_hora_adicional"], 10.5)
        self.assertEqual(p["addons"]["migracion_excel"]["amount"], 155)
        self.assertEqual(p["addons"]["migracion_excel"]["tope"], 500)

    def test_capacity(self):
        data = json.loads(CATALOGO.read_text(encoding="utf-8"))
        c = data["capacity"]
        self.assertEqual(c["max_anclas_paralelas"], 2)
        self.assertIn("15", c["horas_semana"])

    def test_sync_genera_docs(self):
        # verifica que sync no rompa: catalogo.json debe ser espejo de CATALOGO_MODOOPS en modoops_tenant.py
        # esta aserción será verde cuando sync exista, por ahora solo verifica que CATALOGO_MODOOPS subset de modules
        from pathlib import Path as P
        tenant_py = P(__file__).resolve().parents[3] / "modoops_admin" / "models" / "modoops_tenant.py"
        txt = tenant_py.read_text(encoding="utf-8")
        for key in ["mostrador", "deposito", "compras", "fiscal_ar"]:
            self.assertIn(f'"{key}"', txt)


if __name__ == "__main__":
    unittest.main()
