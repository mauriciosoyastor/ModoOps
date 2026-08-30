import sys
import unittest
from pathlib import Path

LOGIC_DIR = Path(__file__).resolve().parents[1] / "logic"
if str(LOGIC_DIR) not in sys.path:
    sys.path.insert(0, str(LOGIC_DIR))

import ot_cobro as oc  # noqa: E402


class OtCobroTests(unittest.TestCase):
    def test_normalize_ok(self):
        data, err = oc.normalize_input({"work_order_id": 1, "amount": 100, "medium": "cash"})
        self.assertIsNone(err)
        self.assertEqual(data["amount"], 100)

    def test_rejects_negative_amount(self):
        data, err = oc.normalize_input({"work_order_id": 1, "amount": -5})
        self.assertIsNotNone(err)

    def test_rejects_bad_medium(self):
        data, err = oc.normalize_input({"work_order_id": 1, "amount": 10, "medium": "bitcoin"})
        self.assertIsNotNone(err)


if __name__ == "__main__":
    unittest.main()
