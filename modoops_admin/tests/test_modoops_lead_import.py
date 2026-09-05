"""Unittest puro: import CSV de leads (captación propia) sin Odoo."""
import unittest

from modoops_admin.logic.lead_import import (
    GSOM_DISCARDED,
    GSOM_KEPT,
    MAX_LEAD_IMPORT_ROWS,
    map_rows,
    parse_csv_bytes,
    to_lead_vals,
)

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


if __name__ == "__main__":
    unittest.main()
