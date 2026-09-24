"""Seam: métricas harness índice (hit rate / savings)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

_DIR = Path(__file__).resolve().parents[1]
if str(_DIR) not in sys.path:
    sys.path.insert(0, str(_DIR))

import harness_recortador_indice as HI  # noqa: E402


class HarnessIndiceMetricsTests(unittest.TestCase):
    def test_hit_rate(self) -> None:
        self.assertEqual(HI.hit_rate(4, 5), 0.8)
        self.assertEqual(HI.hit_rate(0, 0), 0.0)

    def test_savings_vs_all(self) -> None:
        self.assertAlmostEqual(HI.savings_vs_all(100, 40), 0.6)
        self.assertEqual(HI.savings_vs_all(0, 0), 0.0)


if __name__ == "__main__":
    unittest.main()
