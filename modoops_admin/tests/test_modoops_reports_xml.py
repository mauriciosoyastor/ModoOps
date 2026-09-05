"""Unittest puro: reports QWeb acta + situación sin Odoo."""
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

REPORTS = Path(__file__).resolve().parents[1] / "report" / "modoops_reports.xml"


class ReportsTests(unittest.TestCase):
    def setUp(self):
        self.root = ET.parse(REPORTS).getroot()
        self.raw = ET.tostring(self.root, encoding="unicode")

    def test_acta_template_con_firmas_y_saldo(self):
        self.assertIn("report_modoops_acta_hito2_document", self.raw)
        for expected in ["go_live_date", "saldo_usd", "anexo_fiscal_ok", "Firma cliente", "36.119.160"]:
            self.assertIn(expected, self.raw, expected)

    def test_acta_usa_layout_con_logo(self):
        self.assertIn("web.external_layout", self.raw)
        self.assertIn("qweb-pdf", self.raw)

    def test_situacion_template_con_semaforo(self):
        self.assertIn("report_modoops_tenant_situacion_document", self.raw)
        for expected in ["situacion", "saldo_pendiente_usd", "abono_due_date", "suspend_grace_until"]:
            self.assertIn(expected, self.raw, expected)

    def test_manifest_incluye_report(self):
        manifest = (Path(__file__).resolve().parents[1] / "__manifest__.py").read_text(encoding="utf-8")
        self.assertIn("report/modoops_reports.xml", manifest)


if __name__ == "__main__":
    unittest.main()
