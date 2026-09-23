#!/usr/bin/env python3
"""PROTOTYPE (#202): thin client — query once, POST candidates to daemon.

  .\\.venv-win\\Scripts\\python.exe tools\\laya\\recortar_client.py `
    -q "…" -g "…" --json
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

DEFAULT_URL = os.environ.get("LAYA_DAEMON_URL", "http://127.0.0.1:8765/v1/recortar")
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


def post_recortar(url: str, body: dict, timeout: float = 120.0) -> tuple[dict, float]:
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
    ap = argparse.ArgumentParser(description="Client thin → daemon Laya (#202)")
    ap.add_argument("--query", "-q", required=True)
    ap.add_argument("--goal", "-g", required=True)
    ap.add_argument("--url", default=DEFAULT_URL)
    ap.add_argument("--json", action="store_true")
    ap.add_argument(
        "--no-ensure",
        action="store_true",
        help="Do not auto-start daemon (fail if cold)",
    )
    ap.add_argument(
        "--candidates-json",
        help="Skip GitNexus: path to JSON {candidates,goal?,query?}",
    )
    args = ap.parse_args()

    if not args.no_ensure:
        code = ED.ensure(wait=True)
        if code != 0:
            return code

    query_ms = 0.0
    mitigation = None
    if args.candidates_json:
        blob = json.loads(Path(args.candidates_json).read_text(encoding="utf-8"))
        cands = blob["candidates"]
        goal = blob.get("goal") or args.goal
        q = blob.get("query") or args.query
    else:
        t0 = time.perf_counter()
        payload = H.query(args.query, args.goal)
        query_ms = (time.perf_counter() - t0) * 1000.0
        cands = H.compact_candidates(payload, args.goal, args.query)
        mitigation = attach_mitigation(payload, cands)
        goal, q = args.goal, args.query

    try:
        out, rtt_ms = post_recortar(
            args.url, {"goal": goal, "query": q, "candidates": cands}
        )
    except urllib.error.URLError as e:
        print(
            f"ERROR: daemon unreachable at {args.url}: {e}\n"
            "Run: .\\.venv-win\\Scripts\\python.exe tools\\laya\\ensure_daemon.py",
            file=sys.stderr,
        )
        return 1

    out["client_query_ms"] = round(query_ms, 2)
    out["client_rtt_ms"] = round(rtt_ms, 2)
    if mitigation is not None:
        out["attach_mitigation"] = mitigation

    expands = out.get("expand") or []
    out["session_ok"] = bool(expands) and all(not e.get("skipped") for e in expands)

    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 0

    print("==== RECORTAR v2 (daemon) ====", flush=True)
    print(f"query_ms={query_ms:.0f}  rtt_ms={rtt_ms:.0f}  daemon_wall_ms={out.get('wall_ms')}")
    print(f"choice={out.get('laya_choice')}  hybrid={out.get('hybrid_reason')}")
    if mitigation:
        print(
            f"attach raw={mitigation['attach_raw']}/{mitigation['top_n']} "
            f"→ compact={mitigation['attach_after_compact']} "
            f"(recovered={mitigation['recovered_by_summary']})",
            flush=True,
        )
    for i, ex in enumerate(expands, 1):
        print(f"  {i}. {ex.get('process_id')} skipped={ex.get('skipped')} {ex.get('symbol')}")
    print(f"session_ok={out['session_ok']} — abrí context solo de expand[]", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
