"""Silent CRG frescor hooks — no mintty/git-bash.

Cursor should invoke this via pythonw (or python + CREATE_NO_WINDOW parent).
Consumes stdin (Cursor JSON); prints hooks protocol JSON on stdout.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DEBOUNCE_S = float(os.environ.get("CRG_HOOK_DEBOUNCE_S", "2.0"))
STAMP = Path(os.environ.get("CRG_HOOK_STAMP", str(ROOT / ".code-review-graph" / ".hook_stamp")))


def _no_window_kwargs() -> dict:
    if sys.platform == "win32":
        return {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)}
    return {}


def should_skip_debounce(*, now: float | None = None, stamp_path: Path = STAMP) -> bool:
    """True if a recent successful update ran within DEBOUNCE_S."""
    t = now if now is not None else time.time()
    try:
        mtime = stamp_path.stat().st_mtime
    except OSError:
        return False
    return (t - mtime) < DEBOUNCE_S


def touch_stamp(stamp_path: Path = STAMP) -> None:
    stamp_path.parent.mkdir(parents=True, exist_ok=True)
    stamp_path.write_text(str(time.time()), encoding="utf-8")


def run_crg_update(*, cwd: Path = ROOT, timeout: float = 120.0) -> tuple[bool, str]:
    """Run incremental update. Returns (ok, message)."""
    try:
        proc = subprocess.run(
            ["code-review-graph", "update", "--skip-flows"],
            cwd=str(cwd),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
            **_no_window_kwargs(),
        )
    except (OSError, subprocess.TimeoutExpired) as e:
        return False, f"update failed: {e}"
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "").strip()[:300]
        return False, f"update exit {proc.returncode}: {err}"
    return True, "graph updated"


def hook_payload(*, ok: bool, message: str, skipped: bool = False) -> dict:
    return {
        "passed": True,  # never block the editor
        "message": message if ok or skipped else f"soft-fail: {message}",
    }


def main() -> int:
    try:
        sys.stdin.read()
    except OSError:
        pass

    if should_skip_debounce():
        print(json.dumps(hook_payload(ok=True, message="debounced", skipped=True)))
        return 0

    ok, msg = run_crg_update()
    if ok:
        touch_stamp()
    print(json.dumps(hook_payload(ok=ok, message=msg, skipped=False)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
