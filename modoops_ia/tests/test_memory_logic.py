import sys
import unittest
from pathlib import Path

LOGIC_DIR = Path(__file__).resolve().parents[1] / "logic"
if str(LOGIC_DIR) not in sys.path:
    sys.path.insert(0, str(LOGIC_DIR))

import memory as mem  # noqa: E402


class MemoryTests(unittest.TestCase):
    def test_fernet_roundtrip(self):
        key = mem.make_key()
        enc = mem.encrypt_value("hola", key)
        self.assertNotIn("hola", enc)
        self.assertEqual(mem.decrypt_value(enc, key), "hola")

    def test_wrong_key_fails(self):
        enc = mem.encrypt_value("hola", mem.make_key())
        with self.assertRaises(Exception):
            mem.decrypt_value(enc, mem.make_key())

    def test_ciphertext_not_reversible_by_eye(self):
        # base64("hola") == "aG9sYQ==": si el output fuera base64, se lee.
        enc = mem.encrypt_value("hola", mem.make_key())
        self.assertNotEqual(enc, "aG9sYQ==")
        self.assertTrue(mem.looks_fernet(enc))
        self.assertFalse(mem.looks_fernet("aG9sYQ=="))

    def test_legacy_base64_migrates(self):
        key = mem.make_key()
        self.assertEqual(mem.decrypt_maybe_legacy("aG9sYQ==", key), "hola")
        self.assertEqual(mem.decrypt_maybe_legacy(mem.encrypt_value("x", key), key), "x")

    def test_default_valid_until_90d(self):
        self.assertEqual(mem.default_valid_until_iso("2026-01-01"), "2026-04-01")

    def test_clamp_valid_days(self):
        self.assertEqual(mem.clamp_valid_days(None), 90)
        self.assertEqual(mem.clamp_valid_days(0), 1)
        self.assertEqual(mem.clamp_valid_days(-5), 1)
        self.assertEqual(mem.clamp_valid_days(30), 30)
        self.assertEqual(mem.clamp_valid_days(10**6), 365)

    def test_corrupt_token_clear_error(self):
        with self.assertRaises(ValueError):
            mem.decrypt_maybe_legacy("!!!no-base64!!!", mem.make_key())

    def test_should_purge(self):
        self.assertTrue(mem.should_purge("2026-01-01", "2026-08-30"))
        self.assertFalse(mem.should_purge("2026-12-01", "2026-08-30"))
        self.assertFalse(mem.should_purge(None, "2026-08-30"))


if __name__ == "__main__":
    unittest.main()
