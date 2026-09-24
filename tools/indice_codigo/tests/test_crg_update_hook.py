"""Seam: silent CRG hook — debounce + update invocation (mocked)."""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import sys

ROOT = Path(__file__).resolve().parents[3]
HOOKS = Path(__file__).resolve().parents[1] / "hooks"
if str(HOOKS) not in sys.path:
    sys.path.insert(0, str(HOOKS))

import crg_update_hook as H  # noqa: E402


class CrgSilentHookTests(unittest.TestCase):
    def test_debounce_skips_when_stamp_fresh(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            stamp = Path(td) / "stamp"
            stamp.write_text("x", encoding="utf-8")
            now = stamp.stat().st_mtime + 0.5
            self.assertTrue(H.should_skip_debounce(now=now, stamp_path=stamp))

    def test_debounce_allows_when_stamp_old(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            stamp = Path(td) / "stamp"
            stamp.write_text("x", encoding="utf-8")
            now = stamp.stat().st_mtime + 100.0
            self.assertFalse(H.should_skip_debounce(now=now, stamp_path=stamp))

    def test_hook_payload_never_blocks_editor(self) -> None:
        p = H.hook_payload(ok=False, message="boom")
        self.assertTrue(p["passed"])
        self.assertIn("soft-fail", p["message"])

    def test_run_crg_update_ok_mocked(self) -> None:
        with mock.patch.object(H.subprocess, "run") as run:
            run.return_value = mock.Mock(returncode=0, stdout="ok", stderr="")
            ok, msg = H.run_crg_update(cwd=ROOT)
            self.assertTrue(ok)
            self.assertEqual(msg, "graph updated")
            kwargs = run.call_args.kwargs
            if sys.platform == "win32":
                self.assertIn("creationflags", kwargs)

    def test_main_debounced_prints_json(self) -> None:
        with (
            mock.patch.object(H, "should_skip_debounce", return_value=True),
            mock.patch.object(H, "run_crg_update") as upd,
            mock.patch("sys.stdin") as inp,
        ):
            inp.read.return_value = "{}"
            with mock.patch("builtins.print") as pr:
                code = H.main()
            self.assertEqual(code, 0)
            upd.assert_not_called()
            payload = json.loads(pr.call_args[0][0])
            self.assertTrue(payload["passed"])
            self.assertEqual(payload["message"], "debounced")


if __name__ == "__main__":
    unittest.main()
