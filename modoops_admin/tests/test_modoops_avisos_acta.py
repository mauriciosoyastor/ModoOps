"""Unittest puro: avisos mora día 1/5 + acta Hito 2 sin Odoo."""
import importlib.util
import unittest
from datetime import date
from pathlib import Path
import xml.etree.ElementTree as ET


def _load(name):
    path = Path(__file__).resolve().parents[1] / "logic" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


avisos = _load("avisos_mora")


class AvisosTests(unittest.TestCase):
    def test_mora_days(self):
        self.assertEqual(avisos.mora_days(date(2026, 9, 10), date(2026, 9, 11)), 1)
        self.assertEqual(avisos.mora_days(date(2026, 9, 10), date(2026, 9, 15)), 5)
        self.assertIsNone(avisos.mora_days(None, date(2026, 9, 11)))

    def test_solo_dia_1_y_5(self):
        due = date(2026, 9, 10)
        self.assertTrue(avisos.debe_avisar(abono_due_date=due, today=date(2026, 9, 11))[0])
        self.assertTrue(avisos.debe_avisar(abono_due_date=due, today=date(2026, 9, 15))[0])
        self.assertFalse(avisos.debe_avisar(abono_due_date=due, today=date(2026, 9, 13))[0])
        self.assertFalse(avisos.debe_avisar(abono_due_date=due, today=date(2026, 9, 10))[0])

    def test_no_repite_mismo_dia(self):
        due = date(2026, 9, 10)
        day = date(2026, 9, 11)
        self.assertFalse(
            avisos.debe_avisar(abono_due_date=due, today=day, last_warning_sent=day)[0]
        )

    def test_whatsapp_link_normaliza(self):
        link = avisos.whatsapp_link("3547532008", "hola")
        self.assertIn("https://wa.me/543547532008", link)
        self.assertIn("text=", link)

    def test_mensaje_dia5_advierte_suspension(self):
        msg = avisos.mensaje_aviso(dia_mora=5, tenant_name="Pinturería", abono_due_date=date(2026, 9, 10))
        self.assertIn("día 8", msg)
        self.assertIn("Pinturería", msg)

    def test_acta_contiene_saldo_y_firmas(self):
        txt = avisos.acta_hito2_texto(
            contrato_name="MO-2026-001", tenant_name="Pinturería Centro",
            db_name="modoops_pintureria_centro", monto_total=800, saldo=400,
            go_live_date=date(2026, 9, 3), anexo_fiscal_ok=True,
        )
        low = txt.lower()
        for expected in ["MO-2026-001", "400", "Matasini"]:
            self.assertIn(expected, txt)
        self.assertTrue("go-live" in low or "go live" in low)
        self.assertIn("5 días hábiles", txt)


class ViewsCronoTests(unittest.TestCase):
    def test_contrato_tiene_boton_acta(self):
        root = ET.parse(
            Path(__file__).resolve().parents[1] / "views" / "modoops_tenant_contrato_views.xml"
        ).getroot()
        raw = ET.tostring(root, encoding="unicode")
        self.assertIn("action_generar_acta_hito2", raw)

    def test_tenant_tiene_boton_aviso_y_cron(self):
        root = ET.parse(
            Path(__file__).resolve().parents[1] / "views" / "modoops_tenant_views.xml"
        ).getroot()
        self.assertIn("action_enviar_aviso_mora", ET.tostring(root, encoding="unicode"))
        cron = ET.parse(
            Path(__file__).resolve().parents[1] / "data" / "modoops_tenant_cron.xml"
        ).getroot()
        self.assertIn("cron_avisos_mora", ET.tostring(cron, encoding="unicode"))


if __name__ == "__main__":
    unittest.main()
