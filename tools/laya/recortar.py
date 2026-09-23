#!/usr/bin/env python3
"""DEPRECATED (#205 / mapa #198): one-shot recortador (cold-load ~33s cada Shell).

No usar desde la skill ni en sesión Cursor. Camino canónico:
  tools/laya/daemon_http.py + tools/laya/recortar_client.py
  (ver PROTOTYPE_GRAFO_V2.md / .agents/skills/laya-recortador)

Este CLI queda por compatibilidad / benchmarks de cold vs warm.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Same package dir as harness (import by path).
_DIR = Path(__file__).resolve().parent
if str(_DIR) not in sys.path:
    sys.path.insert(0, str(_DIR))

import harness_recortador as H  # noqa: E402


def primary_for_pid(payload: dict, pid: str) -> dict:
    syms = [
        s
        for s in (payload.get("process_symbols") or [])
        if s.get("process_id") == pid
    ]
    if not syms:
        return {
            "process_id": pid,
            "symbol": None,
            "file": None,
            "context_cmd": None,
            "skipped": True,
        }
    s0 = sorted(syms, key=lambda s: s.get("step_index", 99))[0]
    name = s0.get("name")
    fpath = s0.get("filePath")
    cmd = f"gitnexus context {name} --repo ModoOps --limit 20"
    if fpath:
        cmd += f' --file "{fpath}"'
    return {
        "process_id": pid,
        "symbol": name,
        "file": fpath,
        "context_cmd": cmd,
        "skipped": False,
    }


def recortar(q: str, goal: str) -> dict:
    print("Loading Laya…", flush=True)
    agent = H.load_laya()
    print("Laya ready. Running query…", flush=True)
    payload = H.query(q, goal)
    cands = H.compact_candidates(payload, goal, q)
    by_id = {c["id"]: c for c in cands}
    state = H.serialize_state(cands, goal, q)
    chosen, laya_raw = H.laya_pick(agent, state, cands)
    expand_ids, reason = H.hybrid_expand_ids(cands, chosen, laya_raw)

    expands = []
    for pid in expand_ids:
        row = primary_for_pid(payload, pid)
        cand = by_id.get(pid) or {}
        row["summary"] = cand.get("summary")
        row["priority"] = cand.get("priority")
        expands.append(row)

    return {
        "query": q,
        "goal": goal,
        "n_candidates": len(cands),
        "laya_choice": chosen,
        "hybrid_reason": reason,
        "expand": expands,
        "next": (
            "Abrí solo estos context (MCP o CLI). "
            "No expandas el resto de candidatos del query."
        ),
    }


def main() -> int:
    print(
        "WARNING: recortar.py is DEPRECATED (#205). "
        "Use daemon_http.py + recortar_client.py instead.",
        file=sys.stderr,
        flush=True,
    )
    ap = argparse.ArgumentParser(
        description="DEPRECATED one-shot recortador (cold). Prefer recortar_client.py.",
    )
    ap.add_argument("--query", "-q", required=True, help="Texto para gitnexus query")
    ap.add_argument("--goal", "-g", required=True, help="Goal / intención")
    ap.add_argument(
        "--json",
        action="store_true",
        help="Solo JSON en stdout (sin prosa)",
    )
    args = ap.parse_args()

    try:
        result = recortar(args.query, args.goal)
    except Exception as e:  # noqa: BLE001 — CLI prototype
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    print("\n==== RECORTAR ====", flush=True)
    print(f"candidates: {result['n_candidates']}", flush=True)
    print(f"laya_choice: {result['laya_choice']}", flush=True)
    print(f"hybrid: {result['hybrid_reason']}", flush=True)
    print("\nAbrí SOLO estos context:\n", flush=True)
    for i, ex in enumerate(result["expand"], 1):
        if ex.get("skipped"):
            print(f"  {i}. {ex['process_id']} — sin símbolos en payload", flush=True)
            continue
        print(f"  {i}. {ex['process_id']} | {ex.get('summary')}", flush=True)
        print(f"     symbol: {ex['symbol']}", flush=True)
        print(f"     file:   {ex['file']}", flush=True)
        print(f"     cmd:    {ex['context_cmd']}", flush=True)
        print(flush=True)
    print(result["next"], flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
