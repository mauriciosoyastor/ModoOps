#!/usr/bin/env python3
"""Ensure Laya HTTP daemon is up and model-loaded (idempotent).

  .\\.venv-win\\Scripts\\python.exe tools\\laya\\ensure_daemon.py

- If http://127.0.0.1:8765/health reports loaded → exit 0 (already warm).
- If the port is already taken (another daemon loading / half-dead), **wait** —
  never spawn a second console.
- Else spawn daemon_http.py in a **new console** (Windows) / new session
  and poll until loaded (cold ~30–40s once).
- Daemon stays alive until that console/process is closed (Ctrl+C / close window).

Never use for one-shot recortar.py.
"""
from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIR = Path(__file__).resolve().parent
HOST = os.environ.get("LAYA_DAEMON_HOST", "127.0.0.1")
PORT = int(os.environ.get("LAYA_DAEMON_PORT", "8765"))
HEALTH = f"http://{HOST}:{PORT}/health"
DEFAULT_MODEL = ROOT / ".models" / "laya-multilingual"
VENV_PY = ROOT / ".venv-win" / "Scripts" / "python.exe"
TIMEOUT_S = float(os.environ.get("LAYA_ENSURE_TIMEOUT", "120"))


def _python() -> str:
    if VENV_PY.is_file():
        return str(VENV_PY)
    return sys.executable


def health() -> dict | None:
    try:
        with urllib.request.urlopen(HEALTH, timeout=2.0) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        return None


def is_warm(h: dict | None = None) -> bool:
    h = h if h is not None else health()
    return bool(h and h.get("ok") and h.get("loaded"))


def port_in_use(host: str = HOST, port: int = PORT) -> bool:
    """True if something accepts TCP on host:port (daemon up, loading, or fighting)."""
    try:
        with socket.create_connection((host, port), timeout=0.4):
            return True
    except OSError:
        return False


def daemon_http_pids() -> list[int]:
    """PIDs of python processes running tools/laya/daemon_http.py (not this probe)."""
    pids: list[int] = []
    if sys.platform == "win32":
        # Avoid matching the PowerShell probe itself (its CommandLine contains the marker).
        ps = (
            "$marker='tools\\laya\\daemon_http.py';"
            "Get-CimInstance Win32_Process |"
            "Where-Object {"
            "  $_.Name -match '^python' -and"
            "  $_.CommandLine -and"
            "  $_.CommandLine.Contains($marker) -and"
            "  $_.CommandLine -notmatch 'Get-CimInstance'"
            "} |"
            "Select-Object -ExpandProperty ProcessId"
        )
        try:
            out = subprocess.check_output(
                ["powershell", "-NoProfile", "-Command", ps],
                text=True,
                stderr=subprocess.DEVNULL,
                timeout=15,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000),
            )
        except (subprocess.CalledProcessError, OSError, subprocess.TimeoutExpired):
            return []
        for line in out.splitlines():
            line = line.strip()
            if line.isdigit():
                pids.append(int(line))
        return pids
    try:
        out = subprocess.check_output(
            ["pgrep", "-f", "tools/.*/daemon_http.py"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
        for line in out.splitlines():
            line = line.strip()
            if line.isdigit():
                pids.append(int(line))
    except (subprocess.CalledProcessError, OSError, FileNotFoundError):
        pass
    return pids


def should_spawn() -> bool:
    """Spawn only if cold AND nothing already owns the port / daemon process."""
    if is_warm():
        return False
    if port_in_use():
        return False
    if daemon_http_pids():
        return False
    return True


def wait_until_warm(*, timeout_s: float = TIMEOUT_S, label: str = "waiting") -> bool:
    t0 = time.perf_counter()
    while time.perf_counter() - t0 < timeout_s:
        h = health()
        if is_warm(h):
            print(
                f"[ensure_daemon] warm after {time.perf_counter() - t0:.1f}s ({label}) — "
                f"leave the daemon console open; close it to stop.",
                flush=True,
            )
            return True
        time.sleep(1.0)
    return False


def spawn_daemon() -> subprocess.Popen:
    env = os.environ.copy()
    env["USE_TF"] = "0"
    env["PYTHONIOENCODING"] = "utf-8"
    model = env.get("LAYA_MODEL_PATH") or str(DEFAULT_MODEL)
    env["LAYA_MODEL_PATH"] = model
    env.setdefault("LAYA_DAEMON_HOST", HOST)
    env.setdefault("LAYA_DAEMON_PORT", str(PORT))

    cmd = [_python(), str(DIR / "daemon_http.py")]
    kwargs: dict = {
        "cwd": str(ROOT),
        "env": env,
        "stdin": subprocess.DEVNULL,
    }
    if sys.platform == "win32":
        # New console = visible terminal; closing it stops the daemon.
        kwargs["creationflags"] = subprocess.CREATE_NEW_CONSOLE  # type: ignore[attr-defined]
    else:
        kwargs["start_new_session"] = True
        log = DIR / ".daemon.log"
        kwargs["stdout"] = open(log, "a", encoding="utf-8")
        kwargs["stderr"] = subprocess.STDOUT

    print(
        f"[ensure_daemon] starting keep-warm on {HOST}:{PORT} (cold load ~30–40s)…",
        flush=True,
    )
    return subprocess.Popen(cmd, **kwargs)


def ensure(*, wait: bool = True) -> int:
    if is_warm():
        print(f"[ensure_daemon] already_warm {HEALTH}", flush=True)
        return 0

    if not (ROOT / ".models" / "laya-multilingual").exists() and not os.environ.get(
        "LAYA_MODEL_PATH"
    ):
        print(
            "[ensure_daemon] ERROR: missing .models/laya-multilingual "
            "(or set LAYA_MODEL_PATH)",
            file=sys.stderr,
        )
        return 2

    if not should_spawn():
        # Port busy or daemon_http already running but not warm yet — wait, don't double-spawn.
        pids = daemon_http_pids()
        print(
            f"[ensure_daemon] port_or_process_busy {HOST}:{PORT} "
            f"pids={pids or '—'} — waiting (no second console)…",
            flush=True,
        )
        if not wait:
            return 0
        if wait_until_warm(label="busy_wait"):
            return 0
        print(
            f"[ensure_daemon] ERROR: {HOST}:{PORT} occupied but not healthy after "
            f"{TIMEOUT_S}s. Cerrá consolas extra de daemon_http y reintentá.",
            file=sys.stderr,
        )
        return 1

    spawn_daemon()
    if not wait:
        print("[ensure_daemon] spawned (not waiting)", flush=True)
        return 0

    if wait_until_warm(label="cold_start"):
        return 0

    print(
        f"[ensure_daemon] ERROR: timed out after {TIMEOUT_S}s waiting for {HEALTH}",
        file=sys.stderr,
    )
    return 1


def main() -> int:
    args = set(sys.argv[1:])
    if "--check" in args:
        ok = is_warm()
        print("warm" if ok else "cold")
        return 0 if ok else 1
    return ensure(wait="--no-wait" not in args)


if __name__ == "__main__":
    raise SystemExit(main())
