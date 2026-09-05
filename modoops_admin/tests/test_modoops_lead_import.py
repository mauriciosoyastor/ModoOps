"""Unittest puro: import CSV de leads (captación propia) sin Odoo."""
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

from modoops_admin.logic.lead_import import (
    GSOM_DISCARDED,
    GSOM_KEPT,
    MAX_LEAD_IMPORT_ROWS,
    map_rows,
    parse_csv_bytes,
    to_lead_vals,
)

ADMIN = Path(__file__).resolve().parents[1]
WIZARD_MODEL = ADMIN / "models" / "modoops_lead_import_wizard.py"
MODELS_INIT = ADMIN / "models" / "__init__.py"

SAMPLE = (
    "nombre,direccion,telefono,email,web,categoria,rating,lat,lon,place_id,"
    "reviews_texto,review_count,fotos\n"
    '"Pinturería El Taller","Av. Siempreviva 123",+543515550101,,https://ejemplo.test/taller,'
    'Pinturería,4.6,-31.42,-64.18,ChIJ0001,"[''...]'',132,[http://...]\n'
).encode("utf-8")


class ParseCsvTests(unittest.TestCase):
    def test_parses_headers_and_rows(self):
        parsed = parse_csv_bytes(SAMPLE)
        self.assertNotIn("error", parsed)
        self.assertIn("nombre", parsed["headers"])
        self.assertEqual(len(parsed["rows"]), 1)

    def test_bom_parses(self):
        parsed = parse_csv_bytes(b"\xef\xbb\xbf" + SAMPLE)
        self.assertNotIn("error", parsed)
        self.assertIn("nombre", parsed["headers"])

    def test_empty_is_error(self):
        self.assertIn("error", parse_csv_bytes(b""))
        self.assertIn("error", parse_csv_bytes(b"nombre\n"))

    def test_over_limit_is_error(self):
        rows = "nombre\n" + "a\n" * (MAX_LEAD_IMPORT_ROWS + 1)
        self.assertIn("error", parse_csv_bytes(rows.encode("utf-8")))


class MapRowsTests(unittest.TestCase):
    def test_kept_and_discarded(self):
        parsed = parse_csv_bytes(SAMPLE)
        mapped = map_rows(parsed["rows"])
        self.assertEqual(len(mapped["mapped"]), 1)
        row = mapped["mapped"][0]
        for field in GSOM_KEPT:
            self.assertIn(field, row)
        self.assertEqual(
            sorted(mapped["discarded"]),
            sorted(f for f in GSOM_DISCARDED if f in parsed["headers"]),
        )
        self.assertEqual(len(GSOM_KEPT), 13)

    def test_vals_default_nuevo(self):
        parsed = parse_csv_bytes(SAMPLE)
        vals = to_lead_vals(map_rows(parsed["rows"])["mapped"][0])
        self.assertEqual(vals["estado"], "nuevo")
        self.assertEqual(vals["nombre"], "Pinturería El Taller")


class LeadImportWizardFileTests(unittest.TestCase):
    def setUp(self):
        self.raw = WIZARD_MODEL.read_text(encoding="utf-8")

    def test_names(self):
        self.assertIn('"modoops.lead.import.wizard"', self.raw)
        self.assertIn('"modoops.lead.import.line"', self.raw)

    def test_states(self):
        for state in ("upload", "preview", "done"):
            self.assertIn(state, self.raw)

    def test_actions(self):
        self.assertIn("def action_parse_preview", self.raw)
        self.assertIn("def action_apply", self.raw)
        self.assertIn("ensure_one", self.raw)

    def test_apply_creates_nuevo_and_audits(self):
        self.assertIn("modoops.lead", self.raw)
        self.assertIn("modoops.tenant.log", self.raw)

    def test_registered_in_models_init(self):
        init = MODELS_INIT.read_text(encoding="utf-8")
        self.assertIn("modoops_lead_import_wizard", init)


IMPORT_VIEWS = ADMIN / "views" / "modoops_lead_import_views.xml"
MANIFEST = ADMIN / "__manifest__.py"
ACCESS_CSV = ADMIN / "security" / "ir.model.access.csv"


class LeadImportViewsTests(unittest.TestCase):
    def setUp(self):
        self.root = ET.parse(IMPORT_VIEWS).getroot()
        self.raw = ET.tostring(self.root, encoding="unicode")

    def test_wizard_actions(self):
        self.assertIn("modoops.lead.import.wizard", self.raw)
        self.assertIn("action_parse_preview", self.raw)
        self.assertIn("action_apply", self.raw)

    def test_manifest_lists_views(self):
        self.assertIn("modoops_lead_import_views.xml", MANIFEST.read_text(encoding="utf-8"))

    def test_wizard_access_restricted(self):
        text = ACCESS_CSV.read_text(encoding="utf-8")
        self.assertIn("modoops.lead.import.wizard", text)
        self.assertIn("base.group_system", text)


if __name__ == "__main__":
    unittest.main()
