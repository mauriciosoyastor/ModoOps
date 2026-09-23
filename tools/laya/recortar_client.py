#!/usr/bin/env python3
"""PROTOTYPE: thin client — status+diff → POST /v1/recortar-git (sesión canónica).

  .\\.venv-win\\Scripts\\python.exe tools\\laya\\recortar_client.py `
    -g "…" --json

GitNexus path soft-deprecated: use --grafo only for offline/legacy.
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
import harness_recortador as H  # noqa: E402
import recortar_git as RG  # noqa: E402

DEFAULT_GIT_URL = os.environ.get(
    "LAYA_DAEMON_GIT_URL", "http://127.0.0.1:8765/v1/recortar-git"
)
DEFAULT_GRAFO_URL = os.environ.get(
    "LAYA_DAEMON_URL", "http://127.0.0.1:8765/v1/recortar"
)
TOP_N = 10


def attach_mitigation(payload: dict, cands: list[dict]) -> dict:
    """Raw GitNexus attach vs after compact recovery (#206 / dedupe #209)."""
    procs = (payload.get("processes") or [])[:TOP_N]
    syms = payload.get("process_symbols") or []
    by: dict[str, int] = {}
    for s in syms:
        pid = s.get("process_id")
        if pid:
            by[pid] = by.get(pid, 0) + 1
    raw_attached = sum(1 for p in procs if by.get(p.get("id"), 0) > 0)
    after = sum(1 for c in cands if c.get("symbols"))
    recovered = 0
    for c in cands:
        if not c.get("symbols"):
            continue
        if by.get(c["id"], 0) == 0:
            recovered += 1
    n = len(procs) or len(cands) or 1
    return {
        "top_n": len(procs),
        "attach_raw": raw_attached,
        "attach_raw_rate": round(raw_attached / n, 3) if procs else None,
        "attach_after_compact": after,
        "attach_after_rate": round(after / max(len(cands), 1), 3),
        "recovered_by_summary": recovered,
        "note": "recovered_by_summary = empty raw attach fixed via #206 name-in-summary; not an upstream GitNexus fix",
    }


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
        description="Client thin → daemon Laya recortar-git (sesión)"
    )
    ap.add_argument("--goal", "-g", required=True)
    ap.add_argument("--query", "-q", default="", help="Opcional; ayuda al state Laya")
    ap.add_argument("--url", default=None, help="Override daemon URL")
    ap.add_argument("--json", action="store_true")
    ap.add_argument(
        "--no-ensure",
        action="store_true",
        help="Do not auto-start daemon (fail if cold)",
    )
    ap.add_argument(
        "--candidates-json",
        help="Skip git collect: path to JSON {candidates,goal?,query?}",
    )
    ap.add_argument(
        "--grafo",
        action="store_true",
        help="LEGACY soft-deprecated: query GitNexus → /v1/recortar",
    )
    args = ap.parse_args()

    if not args.no_ensure:
        code = ED.ensure(wait=True)
        if code != 0:
            return code

    # --- LEGACY grafo path (soft-deprecated) ---
    if args.grafo:
        if not args.query:
            print("ERROR: --grafo requiere --query / -q", file=sys.stderr)
            return 2
        url = args.url or DEFAULT_GRAFO_URL
        t0 = time.perf_counter()
        payload = H.query(args.query, args.goal)
        query_ms = (time.perf_counter() - t0) * 1000.0
        cands = H.compact_candidates(payload, args.goal, args.query)
        mitigation = attach_mitigation(payload, cands)
        try:
            out, rtt_ms = post_json(
                url, {"goal": args.goal, "query": args.query, "candidates": cands}
            )
        except urllib.error.URLError as e:
            print(
                f"ERROR: daemon unreachable at {url}: {e}\n"
                "Run: .\\.venv-win\\Scripts\\python.exe tools\\laya\\ensure_daemon.py",
                file=sys.stderr,
            )
            return 1
        out["client_query_ms"] = round(query_ms, 2)
        out["client_rtt_ms"] = round(rtt_ms, 2)
        out["attach_mitigation"] = mitigation
        out["mode"] = "grafo_deprecated"
        expands = out.get("expand") or []
        out["session_ok"] = bool(expands) and all(not e.get("skipped") for e in expands)
        if args.json:
            print(json.dumps(out, ensure_ascii=False, indent=2))
        else:
            print("==== RECORTAR grafo (DEPRECATED) ====", flush=True)
            print(f"session_ok={out['session_ok']} — preferí path git sin --grafo")
        return 0

    # --- Canonical: status+diff ---
    url = args.url or DEFAULT_GIT_URL
    collect_ms = 0.0
    if args.candidates_json:
        blob = json.loads(
            Path(args.candidates_json).read_text(encoding="utf-8-sig")
        )
        raw = blob["candidates"]
        goal = blob.get("goal") or args.goal
        q = blob.get("query") or args.query
        cands = RG.filter_and_rank(raw)
    else:
        try:
            t0 = time.perf_counter()
            cands = RG.collect_status_diff()
            collect_ms = (time.perf_counter() - t0) * 1000.0
        except RG.GitCollectError as e:
            print(f"ERROR: no se pudo leer status+diff: {e}", file=sys.stderr)
            return 4
        goal, q = args.goal, args.query

    if not cands:
        out = {
            "goal": goal,
            "query": q,
            "n_candidates": 0,
            "expand": [],
            "expand_ids": [],
            "abort": True,
            "abort_reason": "clean_tree",
            "session_ok": False,
            "mode": "git",
            "message": (
                "No hay candidatos en el working tree (status+diff vacío tras filtros). "
                "Ensuciá el tree o usá impact/query a mano; el recortador git no usa el grafo."
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
    out["mode"] = "git"
    expands = out.get("expand") or []
    if "session_ok" not in out:
        out["session_ok"] = bool(expands) and all(not e.get("skipped") for e in expands)

    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 0

    print("==== RECORTAR git (sesión) ====", flush=True)
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
