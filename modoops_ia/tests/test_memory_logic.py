import sys
import unittest
from pathlib import Path

LOGIC_DIR = Path(__file__).resolve().parents[1] / "logic"
if str(LOGIC_DIR) not in sys.path:
    sys.path.insert(0, str(LOGIC_DIR))

import memory as mem  # noqa: E402


class MemoryTests(unittest.TestCase):
    def test_encrypt_roundtrip(self):
        enc = mem.encrypt_value("hola")
        self.assertEqual(mem.decrypt_value(enc), "hola")

    def test_should_purge(self):
        self.assertTrue(mem.should_purge("2026-01-01", "2026-08-30"))
        self.assertFalse(mem.should_purge("2026-12-01", "2026-08-30"))
        self.assertFalse(mem.should_purge(None, "2026-08-30"))


if __name__ == "__main__":
    unittest.main()
