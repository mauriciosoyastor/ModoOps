import sys
import unittest
from pathlib import Path

LOGIC_DIR = Path(__file__).resolve().parents[1] / "logic"
if str(LOGIC_DIR) not in sys.path:
    sys.path.insert(0, str(LOGIC_DIR))

import executor as ex  # noqa: E402


class ExecutorTests(unittest.TestCase):
    def test_supported_tools(self):
        self.assertTrue(ex.is_supported("echo"))
        self.assertTrue(ex.is_supported("stock.consulta"))
        self.assertTrue(ex.is_supported("ot.cobro"))
        self.assertFalse(ex.is_supported("no.existe"))
        self.assertFalse(ex.is_supported(None))

    def test_run_id_format(self):
        self.assertEqual(ex.run_id("modoops_demo", "echo", "abc"), "modoops_demo:echo:abc")

    def test_serialize_roundtrip(self):
        payload = {"b": 1, "a": "x"}
        self.assertEqual(ex.deserialize_payload(ex.serialize_payload(payload)), payload)
        self.assertEqual(ex.deserialize_payload(""), {})
        self.assertEqual(ex.deserialize_payload(None), {})

    def test_ok_envelope(self):
        env = ex.ok_envelope("modoops_demo", "echo", "abc", {"echo": 1})
        self.assertEqual(env["status"], "ok")
        self.assertEqual(env["runId"], "modoops_demo:echo:abc")
        self.assertEqual(env["output"], {"echo": 1})
        self.assertFalse(env["replayed"])

    def test_ok_envelope_replayed(self):
        env = ex.ok_envelope("modoops_demo", "echo", "abc", {}, replayed=True)
        self.assertTrue(env["replayed"])

    def test_error_envelope(self):
        env = ex.error_envelope("modoops_demo", "ot.cobro", "abc", "error", "sin caja")
        self.assertEqual(env["status"], "error")
        self.assertEqual(env["code"], "error")
        self.assertIn("sin caja", env["error"])

    def test_needs_tool_envelope(self):
        env = ex.error_envelope("modoops_demo", "no.existe", "abc", "unknown_tool", "no existe", status="needs_tool")
        self.assertEqual(env["status"], "needs_tool")


if __name__ == "__main__":
    unittest.main()
