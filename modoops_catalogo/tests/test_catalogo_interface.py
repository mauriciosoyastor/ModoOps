"""TDD seam interface — modoops_catalogo deep module.

Tests cruzan la tapa pública (get/allKeys/validate/toSelection/pricing/horasFor),
no detalles de generación. Offline, sin Odoo ni FS real (inyecta dict).
"""

import unittest

from modoops_catalogo import Catalogo


# catalogo fake mínimo para tests offline (no lee FS)
FAKE_DATA = {
    "modules": {
        "mostrador": {"modoops": "Mostrador", "label": "Mostrador (POS 2 cajas)", "horas": 25, "odoo": ["point_of_sale"]},
        "deposito": {"modoops": "Depósito Inteligente", "label": "Depósito Inteligente (1 almacén)", "horas": 20, "odoo": ["stock"]},
        "compras": {"modoops": "Compras", "label": "Compras", "horas": 15, "odoo": ["purchase"]},
        "fiscal_ar": {"modoops": "Fiscal AR", "label": "Fiscal AR", "horas": 15, "odoo": ["account", "l10n_ar"]},
        "contactos": {"modoops": "Contactos", "label": "Contactos", "horas": 5, "odoo": ["contacts"]},
        "plataforma": {"modoops": "Plataforma ModoOps", "label": "Plataforma ModoOps", "horas": 10, "odoo": ["modoops_core"]},
        "puente_factura": {"modoops": "Puente Factura Web", "label": "Puente Factura Web", "horas": 5, "odoo": ["modoops_integrations"]},
        "ventas": {"modoops": "Ventas", "label": "Ventas", "horas": 15, "odoo": ["sale_management"]},
        "taller": {"modoops": "Taller", "label": "Taller (Add-on $155)", "horas": 20, "odoo": ["modoops_core"]},
        "migracion_excel": {"modoops": "Migración Excel", "label": "Migración Excel (≤500 prod)", "horas": 10, "odoo": []},
        "b2b_basico": {"modoops": "B2B Básico", "label": "B2B Básico (Add-on $155)", "horas": 20, "odoo": []},
        "ia": {"modoops": "IA ModoOps — Agente", "label": "IA ModoOps — Agente herramental (Tools + Memoria)", "horas": 15, "odoo": ["modoops_ia"]},
    },
    "pricing": {
        "tarifa_diaria": 52,
        "descubrimiento": {"amount": 155, "extra_day": 52, "credito": 77.5, "validez_dias": 20},
        "ancla": {"amount": 800, "anticipo": 400, "hito1": 200, "hito2": 200, "techo_horas": 92, "techo_ajustes": 8, "validez_dias": 20},
        "abono": {"amount": 45, "horas": 4},
        "tarifa_hora_adicional": 10.5,
    },
}


class TestCatalogoInterface(unittest.TestCase):
    def setUp(self):
        self.cat = Catalogo(FAKE_DATA)

    def test_get_existing(self):
        m = self.cat.get("mostrador")
        self.assertEqual(m["modoops"], "Mostrador")
        self.assertEqual(m["horas"], 25)

    def test_get_missing_returns_none(self):
        self.assertIsNone(self.cat.get("inexistente"))

    def test_allKeys_includes_ventas_plataforma_puente(self):
        keys = self.cat.allKeys()
        self.assertIn("ventas", keys)
        self.assertIn("plataforma", keys)
        self.assertIn("puente_factura", keys)
        self.assertIn("ia", keys)
        self.assertEqual(len(keys), 12)

    def test_validate_ok(self):
        out = self.cat.validate(["mostrador", "deposito"], anexo_fiscal_ref="AF-001")
        self.assertTrue(out["valid"])
        self.assertEqual(out["errors"], [])

    def test_validate_hard_gate_modulo_inexistente(self):
        out = self.cat.validate(["inexistente"])
        self.assertFalse(out["valid"])
        self.assertTrue(any("no existe en catálogo" in e for e in out["errors"]))

    def test_validate_hard_gate_fiscal_sin_anexo(self):
        out = self.cat.validate(["mostrador", "fiscal_ar"], anexo_fiscal_ref=None)
        self.assertFalse(out["valid"])
        self.assertTrue(any("anexo_fiscal_ref" in e for e in out["errors"]))

    def test_validate_fiscal_con_anexo_ok(self):
        out = self.cat.validate(["fiscal_ar"], anexo_fiscal_ref="AF-2026-001")
        self.assertTrue(out["valid"])

    def test_toSelection_contains_all_keys_with_labels(self):
        sel = self.cat.toSelection()
        d = dict(sel)
        self.assertEqual(d["mostrador"], "Mostrador (POS 2 cajas)")
        self.assertEqual(d["ia"], "IA ModoOps — Agente herramental (Tools + Memoria)")
        self.assertEqual(len(sel), 12)

    def test_pricing_returns_800_92_20(self):
        p = self.cat.pricing()
        self.assertEqual(p["ancla"]["amount"], 800)
        self.assertEqual(p["ancla"]["techo_horas"], 92)
        self.assertEqual(p["ancla"]["techo_ajustes"], 8)
        self.assertEqual(p["ancla"]["validez_dias"], 20)
        self.assertEqual(p["descubrimiento"]["amount"], 155)
        self.assertEqual(p["tarifa_hora_adicional"], 10.5)

    def test_horasFor_suma(self):
        self.assertEqual(self.cat.horasFor(["mostrador", "deposito"]), 45)  # 25+20
        self.assertEqual(self.cat.horasFor(["mostrador", "deposito", "compras", "fiscal_ar", "contactos"]), 80)

    def test_horasFor_supera_techo(self):
        # 7 módulos ancla retail: 25+20+15+15+15+5+10+5 = 110 >92
        keys = ["mostrador", "deposito", "ventas", "compras", "fiscal_ar", "contactos", "plataforma", "puente_factura"]
        total = self.cat.horasFor(keys)
        self.assertEqual(total, 110)
        self.assertGreater(total, self.cat.techoHoras())

    def test_techo_helpers(self):
        self.assertEqual(self.cat.techoHoras(), 92)
        self.assertEqual(self.cat.techoAjustes(), 8)

    def test_load_from_real_file(self):
        # sanity: real file has 12 keys and pricing 800
        real = Catalogo.load()
        self.assertEqual(len(real.allKeys()), 12)
        self.assertEqual(real.pricing()["ancla"]["amount"], 800)
