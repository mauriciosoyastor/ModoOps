"""TDD seam logic pura — Configurador."""

import unittest
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
LOGIC_DIR = REPO / "tools" / "configurador" / "logic"
if str(LOGIC_DIR) not in sys.path:
    sys.path.insert(0, str(LOGIC_DIR))

import configurador  # noqa: E402


class ConfiguradorTests(unittest.TestCase):
    def test_genera_lista_cerrada_retail_ok(self):
        inp = {
            "vertical": "retail",
            "sucursales": 1,
            "almacenes": 1,
            "cajas_pos": 2,
            "modulos_tildados": ["mostrador", "deposito", "compras", "fiscal_ar", "contactos"],
            "anexo_fiscal_ref": "AF-2026-001",
            "sku_count": 120,
            "usuarios": 5,
            "lista_precios": 1,
        }
        out = configurador.generar(inp)
        self.assertIn("lista_cerrada", out)
        self.assertIn("propuesta", out)
        self.assertIn("anexo_tecnico", out)
        self.assertEqual(out["precio"]["ancla"], 800)
        self.assertEqual(out["precio"]["validez_dias"], 20)
        self.assertEqual(out["precio"]["anticipo_neto"], 322.5)  # con credito
        self.assertEqual(out["errors"], [])
        # marca blanca: propuesta no menciona mapeo técnico
        self.assertNotIn("point_of_sale", out["propuesta"]["comercial_md"].lower())
        self.assertNotIn("l10n_ar", out["propuesta"]["comercial_md"].lower())
        self.assertIn("point_of_sale", out["anexo_tecnico"]["mapeo"]["mostrador"]["odoo"][0])

    def test_hard_gate_modulo_no_existe(self):
        inp = {
            "vertical": "retail",
            "sucursales": 1,
            "almacenes": 1,
            "cajas_pos": 1,
            "modulos_tildados": ["no_existe"],
            "sku_count": 0,
        }
        out = configurador.generar(inp)
        self.assertTrue(any("no_existe" in e for e in out["errors"]))
        self.assertTrue("catalogo" in out["errors"][0].lower() or "catálogo" in out["errors"][0].lower())

    def test_hard_gate_falta_anexo_fiscal(self):
        inp = {
            "vertical": "retail",
            "sucursales": 1,
            "almacenes": 1,
            "cajas_pos": 1,
            "modulos_tildados": ["fiscal_ar"],
            "sku_count": 10,
        }
        out = configurador.generar(inp)
        self.assertTrue(any("fiscal" in e.lower() for e in out["errors"]))

    def test_soft_gate_techo_horas(self):
        inp = {
            "vertical": "retail",
            "sucursales": 1,
            "almacenes": 1,
            "cajas_pos": 2,
            "modulos_tildados": ["mostrador", "deposito", "ventas", "compras", "fiscal_ar", "contactos", "plataforma", "puente_factura", "taller", "b2b_basico"],
            "anexo_fiscal_ref": "AF-1",
            "sku_count": 0,
        }
        out = configurador.generar(inp)
        # supera techo 92h -> warning Fase 2
        self.assertTrue(len(out["warnings"]) > 0)
        self.assertTrue(any("92" in w or "Fase 2" in w for w in out["warnings"]))

    def test_addon_migracion_tope(self):
        inp = {
            "vertical": "retail",
            "sucursales": 1,
            "almacenes": 1,
            "cajas_pos": 1,
            "modulos_tildados": ["mostrador"],
            "sku_count": 600,  # supera 500
        }
        out = configurador.generar(inp)
        self.assertTrue(any("500" in w for w in out["warnings"]))

    def test_moneda_ars_tipo_cambio(self):
        inp = {
            "vertical": "retail",
            "sucursales": 1,
            "almacenes": 1,
            "cajas_pos": 1,
            "modulos_tildados": ["mostrador"],
            "sku_count": 0,
            "ars_tipo_cambio": 1200.5,
        }
        out = configurador.generar(inp)
        self.assertEqual(out["precio"]["ars_tipo_cambio"], 1200.5)

    def test_is_pure_module(self):
        # no importa odoo
        src = (LOGIC_DIR / "configurador.py").read_text(encoding="utf-8")
        self.assertNotIn("from odoo", src)
        self.assertNotIn("import odoo", src)


if __name__ == "__main__":
    unittest.main()
