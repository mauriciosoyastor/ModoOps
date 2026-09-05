"""Unittest puro: checker CSV post-renombre para S2."""
import csv
import tempfile
import unittest
from pathlib import Path

from tools.gmaps.check_csv import check_csv

KEPT = [
    "nombre", "direccion", "telefono", "email", "web", "categoria",
    "rating", "lat", "lon", "place_id", "fuente", "fecha_captura", "estado",
]


def make_csv(headers, n_rows):
    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".csv", delete=False, encoding="utf-8", newline=""
    )
    writer = csv.DictWriter(tmp, fieldnames=headers)
    writer.writeheader()
    for i in range(n_rows):
        writer.writerow({h: f"v{i}" for h in headers})
    tmp.close()
    return Path(tmp.name)


class CheckCsvTests(unittest.TestCase):
    def test_valid_passes(self):
        path = make_csv(KEPT, 3)
        result = check_csv(path)
        self.assertTrue(result["ok"], result["errors"])
        path.unlink()

    def test_missing_headers_fail(self):
        path = make_csv(["nombre", "direccion"], 2)
        result = check_csv(path)
        self.assertFalse(result["ok"])
        self.assertTrue(any("telefono" in e for e in result["errors"]))
        path.unlink()

    def test_empty_fails(self):
        path = make_csv(KEPT, 0)
        result = check_csv(path)
        self.assertFalse(result["ok"])
        path.unlink()

    def test_over_limit_fails(self):
        path = make_csv(KEPT, 501)
        result = check_csv(path)
        self.assertFalse(result["ok"])
        path.unlink()


if __name__ == "__main__":
    unittest.main()
