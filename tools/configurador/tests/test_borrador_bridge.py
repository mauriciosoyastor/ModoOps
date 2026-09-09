"""TDD ticket 02 — puente borrador v1 → Configurador.

Fixtures 100% en memoria (incluido un catálogo dict mínimo para `generar`):
sin filesystem, sin Odoo, sin red.
"""

import unittest
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
LOGIC_DIR = REPO / "tools" / "configurador" / "logic"
if str(LOGIC_DIR) not in sys.path:
    sys.path.insert(0, str(LOGIC_DIR))

import configurador  # noqa: E402
import borrador_bridge  # noqa: E402


def catalogo_fake():
    modulos = {}
    for k in ["mostrador", "deposito", "ventas", "compras", "fiscal_ar",
              "contactos", "plataforma", "puente_factura",
              "taller", "migracion_excel", "b2b_basico", "ia"]:
        modulos[k] = {"modoops": k, "odoo": [f"mod_{k}"], "version": "test"}
    modulos["mostrador"]["odoo"] = ["point_of_sale"]
    return {
        "modules": modulos,
        "pricing": {
            "ancla": {"amount": 800, "validez_dias": 20, "anticipo": 400,
                      "techo_horas": 92, "techo_ajustes": 8},
            "descubrimiento": {"credito": 77.5},
            "tarifa_hora_adicional": 10.5,
        },
    }


def borrador_pintureria():
    return {
        "version": "borrador-v1",
        "vinculante": False,
        "origen": "portal-oficina-3d",
        "prospecto": {"nombre": "Pinturería Centro", "contacto_nombre": "Ana",
                      "telefono": "3547000000", "email": "", "rubro": "retail",
                      "sucursales": 1, "cajas": 2, "usuarios": 5},
        "objetos": {
            "mostrador-3d": {"cajas": 2, "descuento": True},
            "estanteria-3d": {"almacenes": 1, "ubicaciones": True},
            "gondola-3d": {"listas_precio": 1},
            "computadora-3d": {"proveedores": 12, "orden_compra": True},
            "pizarron-fiscal-3d": {"comprobantes": ["Factura B"], "contador": "Estudio López"},
            "puerta-crecer-3d": {"futuros": ["migracion_excel"]},
        },
        "modulos_ancla": ["mostrador", "deposito", "ventas", "compras", "fiscal_ar", "contactos"],
        "modulos_futuros": ["migracion_excel"],
        "horas_estimadas": 105,
        "datos": {"productos_aprox": 350, "tiene_excel": True},
        "infra": {"hosting_propio": False, "dominio_ssl": False, "backups": False},
    }


class BorradorBridgeTests(unittest.TestCase):
    def test_traduce_campos_del_borrador(self):
        inp = borrador_bridge.traducir_borrador(borrador_pintureria())
        self.assertEqual(inp["vertical"], "retail")
        self.assertEqual(inp["sucursales"], 1)
        self.assertEqual(inp["almacenes"], 1)
        self.assertEqual(inp["cajas_pos"], 2)
        self.assertEqual(inp["sku_count"], 350)
        self.assertEqual(inp["usuarios"], 5)
        self.assertEqual(inp["lista_precios"], 1)
        self.assertEqual(inp["modulos_tildados"],
                         ["mostrador", "deposito", "ventas", "compras",
                          "fiscal_ar", "contactos", "migracion_excel"])
        # el portal nunca trae anexo firmado
        self.assertIsNone(inp["anexo_fiscal_ref"])

    def test_borrador_da_hard_gate_fiscal_y_con_anexo_queda_limpio(self):
        inp = borrador_bridge.traducir_borrador(borrador_pintureria())
        sin_anexo = configurador.generar(inp, catalogo=catalogo_fake())
        self.assertTrue(any("fiscal" in e.lower() for e in sin_anexo["errors"]))
        con_anexo = configurador.generar({**inp, "anexo_fiscal_ref": "AF-2026-014"},
                                         catalogo=catalogo_fake())
        self.assertEqual(con_anexo["errors"], [])
        self.assertEqual(con_anexo["precio"]["ancla"], 800)
        self.assertEqual(con_anexo["precio"]["anticipo_neto"], 322.5)
        self.assertIn("migracion_excel", con_anexo["precio"]["addons"])
        self.assertIn("point_of_sale", con_anexo["anexo_tecnico"]["mapeo"]["mostrador"]["odoo"][0])
        self.assertNotIn("point_of_sale", con_anexo["propuesta"]["comercial_md"].lower())

    def test_hard_gate_modulo_inexistente(self):
        b = borrador_pintureria()
        b["modulos_ancla"] = ["mostrador", "no_existe"]
        inp = borrador_bridge.traducir_borrador(b)
        out = configurador.generar(inp, catalogo=catalogo_fake())
        self.assertTrue(any("no_existe" in e for e in out["errors"]))

    def test_avisos_techo_y_tope(self):
        b = borrador_pintureria()
        b["datos"] = {"productos_aprox": 600, "tiene_excel": True}  # supera 500
        inp = borrador_bridge.traducir_borrador({**b, "anexo_fiscal_ref": None})
        out = configurador.generar({**inp, "anexo_fiscal_ref": "AF-1"}, catalogo=catalogo_fake())
        self.assertTrue(any("500" in w for w in out["warnings"]))  # tramo extra
        self.assertTrue(any("Fase 2" in w for w in out["warnings"]))  # 105h > 92h

    def test_valores_faltantes_tienen_defaults_sanos(self):
        inp = borrador_bridge.traducir_borrador({})
        self.assertEqual(inp["vertical"], "retail")
        self.assertEqual(inp["sucursales"], 1)
        self.assertEqual(inp["cajas_pos"], 1)
        self.assertEqual(inp["modulos_tildados"], [])
        self.assertIsNone(inp["anexo_fiscal_ref"])

    def test_modulos_puros(self):
        for nombre in ("borrador_bridge.py", "configurador.py"):
            src = (LOGIC_DIR / nombre).read_text(encoding="utf-8")
            self.assertNotIn("from odoo", src)
            self.assertNotIn("import odoo", src)


if __name__ == "__main__":
    unittest.main()
