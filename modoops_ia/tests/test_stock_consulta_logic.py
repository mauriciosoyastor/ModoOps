import sys
import unittest
from pathlib import Path

LOGIC_DIR = Path(__file__).resolve().parents[1] / "logic"
if str(LOGIC_DIR) not in sys.path:
    sys.path.insert(0, str(LOGIC_DIR))

import stock_consulta as sc  # noqa: E402


class StockConsultaTests(unittest.TestCase):
    def test_normalize_ok(self):
        data, err = sc.normalize_input({"product_id": 10, "location_id": 5})
        self.assertIsNone(err)
        self.assertEqual(data["product_id"], 10)

    def test_rejects_invalid_product(self):
        data, err = sc.normalize_input({"product_id": -1})
        self.assertIsNotNone(err)

    def test_format_result(self):
        self.assertEqual(sc.format_result(10, 3.5)["qty"], 3.5)


if __name__ == "__main__":
    unittest.main()
