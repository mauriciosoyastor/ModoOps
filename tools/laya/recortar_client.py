#!/usr/bin/env python3
"""PROTOTYPE: thin client — solo Índice CRG → POST /v1/recortar-git.

  .\\.venv-win\\Scripts\\python.exe tools\\laya\\recortar_client.py -g "…" -q "…" --json
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

_DIR = Path(__file__).resolve().parent
if str(_DIR) not in sys.path:
    sys.path.insert(0, str(_DIR))

import ensure_daemon as ED  # noqa: E402
import recortar_git as RG  # noqa: E402
import recortar_indice as RI  # noqa: E402

DEFAULT_GIT_URL = os.environ.get(
    "LAYA_DAEMON_GIT_URL", "http://127.0.0.1:8765/v1/recortar-git"
)


def post_json(url: str, body: dict, timeout: float = 120.0) -> tuple[dict, float]:
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    t0 = time.perf_counter()
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
    rtt_ms = (time.perf_counter() - t0) * 1000.0
    return json.loads(raw), rtt_ms


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Client thin → daemon Laya (solo Índice CRG → /v1/recortar-git)"
    )
    ap.add_argument("--goal", "-g", required=True)
    ap.add_argument(
        "--query",
        "-q",
        default="",
        help="Query de search del Índice (default=goal)",
    )
    ap.add_argument("--url", default=None, help="Override daemon URL")
    ap.add_argument("--json", action="store_true")
    ap.add_argument(
        "--indice",
        action="store_true",
        default=True,
        help=argparse.SUPPRESS,  # legacy no-op: siempre índice
    )
    ap.add_argument(
        "--no-ensure",
        action="store_true",
        help="Do not auto-start daemon (fail if cold)",
    )
    ap.add_argument(
        "--candidates-json",
        help="Skip collect: path to JSON {candidates,goal?,query?}",
    )
    args = ap.parse_args()

    if not args.no_ensure:
        code = ED.ensure(wait=True)
        if code != 0:
            return code

    url = args.url or DEFAULT_GIT_URL
    collect_ms = 0.0
    mode = "indice"
    if args.candidates_json:
        blob = json.loads(
            Path(args.candidates_json).read_text(encoding="utf-8-sig")
        )
        raw = blob["candidates"]
        goal = blob.get("goal") or args.goal
        q = blob.get("query") or args.query
        cands = RG.filter_and_rank(raw)
        mode = blob.get("mode") or "indice"
    else:
        goal = args.goal
        q = (args.query or args.goal).strip()
        try:
            t0 = time.perf_counter()
            cands = RI.collect_indice(q)
            collect_ms = (time.perf_counter() - t0) * 1000.0
        except RI.IndiceCollectError as e:
            print(f"ERROR: Índice/CRG: {e}", file=sys.stderr)
            return 4

    if not cands:
        out = {
            "goal": goal,
            "query": q,
            "n_candidates": 0,
            "expand": [],
            "expand_ids": [],
            "abort": True,
            "abort_reason": "no_indice_hits",
            "session_ok": False,
            "mode": mode,
            "message": (
                "Sin candidatos del Índice (search vacío). "
                "Probá otra -q, CLI code-review-graph, o Grep solo si CRG down."
            ),
            "client_collect_ms": round(collect_ms, 2),
        }
        if args.json:
            print(json.dumps(out, ensure_ascii=False, indent=2))
        else:
            print(out["message"], flush=True)
        return 3

    try:
        out, rtt_ms = post_json(
            url, {"goal": goal, "query": q, "candidates": cands}
        )
    except urllib.error.URLError as e:
        print(
            f"ERROR: daemon unreachable at {url}: {e}\n"
            "Si el daemon es viejo (sin /v1/recortar-git), reinicialo:\n"
            "  .\\.venv-win\\Scripts\\python.exe tools\\laya\\ensure_daemon.py\n"
            "o cerrá la consola del daemon y volvé a ensure.",
            file=sys.stderr,
        )
        return 1

    out["client_collect_ms"] = round(collect_ms, 2)
    out["client_rtt_ms"] = round(rtt_ms, 2)
    out["mode"] = mode
    expands = out.get("expand") or []
    if "session_ok" not in out:
        out["session_ok"] = bool(expands) and all(not e.get("skipped") for e in expands)

    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 0

    print("==== RECORTAR indice (sesión) ====", flush=True)
    print(
        f"collect_ms={collect_ms:.0f}  rtt_ms={rtt_ms:.0f}  "
        f"daemon_wall_ms={out.get('wall_ms')}  n={out.get('n_candidates')}"
    )
    print(f"choice={out.get('laya_choice')}  hybrid={out.get('hybrid_reason')}")
    for i, ex in enumerate(expands, 1):
        print(
            f"  {i}. {ex.get('path')} skipped={ex.get('skipped')} "
            f"status={ex.get('status')}"
        )
    print(
        f"session_ok={out.get('session_ok')} — abrí Read solo de expand[].path",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
