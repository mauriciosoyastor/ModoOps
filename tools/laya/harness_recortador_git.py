#!/usr/bin/env python3
"""Harness Recortador git — A/B/Laya sobre fixtures (sin GitNexus).

Umbrales (grill / #201):
  hits ≥ 4/5
  ahorro vs A ≥ 40%
  wall overhead (daemon RTT o in-process) mediana ≤ 2s
  Laya tokens ≤ B * 1.05 y calls ≤ B
"""
from __future__ import annotations

import json
import statistics
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

_DIR = Path(__file__).resolve().parent
if str(_DIR) not in sys.path:
    sys.path.insert(0, str(_DIR))

import harness_recortador as H  # noqa: E402
import recortar_git as RG  # noqa: E402

ARCHETYPES = _DIR / "archetypes_git.json"
OUT = _DIR / "harness_git_last_run.json"
DAEMON_URL = "http://127.0.0.1:8765/v1/recortar-git"
HITS_GE = 4
SAVINGS_A_GE = 0.40
WALL_OVERHEAD_S = 2.0
B_CHARS_SLACK = 1.05
ROOT = H.ROOT


def read_tokens(path: str) -> int:
    fp = ROOT / path
    try:
        text = fp.read_text(encoding="utf-8", errors="replace")[:8000]
    except OSError:
        text = path
    return H.tok(text)


def measure_row(a: dict, agent, use_daemon: bool) -> dict:
    goal = a["goal"]
    query = a.get("query") or ""
    gold = RG.norm_path(a["gold_path"])
    cands = RG.filter_and_rank(a["candidates"])
    q_tok = H.tok({"goal": goal, "candidates": cands})

    # A = all candidate file reads
    a_paths = [c["path"] for c in cands]
    a_ctx = sum(read_tokens(p) for p in a_paths)
    a_total = q_tok + a_ctx
    a_calls = 1 + len(a_paths)

    # B = top-2 priority
    ranked = sorted(cands, key=lambda c: float(c["priority"]), reverse=True)
    b_paths = [c["path"] for c in ranked[:2]]
    b_ctx = sum(read_tokens(p) for p in b_paths)
    b_total = q_tok + b_ctx
    b_calls = 1 + len(b_paths)

    rtt_ms = 0.0
    if use_daemon:
        body = {"goal": goal, "query": query, "candidates": a["candidates"]}
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(
            DAEMON_URL,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        t0 = time.perf_counter()
        with urllib.request.urlopen(req, timeout=180) as resp:
            out = json.loads(resp.read().decode("utf-8"))
        rtt_ms = (time.perf_counter() - t0) * 1000.0
    else:
        out = RG.pick_from_git_candidates(agent, goal, query, cands)

    expand = out.get("expand") or []
    l_paths = [RG.norm_path(e["path"]) for e in expand if not e.get("skipped") and e.get("path")]
    l_ctx = sum(read_tokens(p) for p in l_paths)
    l_total = q_tok + l_ctx
    l_calls = 1 + len(l_paths)
    hit = gold in l_paths
    save_a = (a_total - l_total) / a_total if a_total else 0.0

    return {
        "id": a["id"],
        "goal": goal,
        "gold_path": gold,
        "hit": hit,
        "gold_in_candidates": gold in a_paths,
        "n_candidates": len(cands),
        "expand_paths": l_paths,
        "hybrid_reason": out.get("hybrid_reason"),
        "rtt_ms": round(rtt_ms, 2),
        "daemon_wall_ms": out.get("wall_ms"),
        "tokens": {
            "query": q_tok,
            "A": a_total,
            "B": b_total,
            "Laya": l_total,
            "save_A": round(save_a, 4),
        },
        "calls": {"A": a_calls, "B": b_calls, "Laya": l_calls},
    }


def daemon_up() -> bool:
    try:
        urllib.request.urlopen("http://127.0.0.1:8765/health", timeout=2)
        return True
    except Exception:
        return False


def main() -> int:
    archetypes = json.loads(ARCHETYPES.read_text(encoding="utf-8"))
    use_daemon = daemon_up()
    agent = None
    if use_daemon:
        print("Harness git — daemon warm → POST /v1/recortar-git", flush=True)
    else:
        print("Harness git — in-process Laya (daemon cold)", flush=True)
        agent = H.load_laya()
        print("Laya ready.\n", flush=True)

    rows = []
    for a in archetypes:
        print(f"=== #{a['id']} {a['goal'][:50]}… ===", flush=True)
        row = measure_row(a, agent, use_daemon)
        print(
            f"  hit={row['hit']} save_a={row['tokens']['save_A']:.1%} "
            f"tok A/B/L={row['tokens']['A']}/{row['tokens']['B']}/{row['tokens']['Laya']} "
            f"expand={row['expand_paths']}",
            flush=True,
        )
        rows.append(row)

    hits = sum(1 for r in rows if r["hit"])
    sum_a = sum(r["tokens"]["A"] for r in rows)
    sum_b = sum(r["tokens"]["B"] for r in rows)
    sum_l = sum(r["tokens"]["Laya"] for r in rows)
    save_a = (sum_a - sum_l) / sum_a if sum_a else 0.0
    calls_b = sum(r["calls"]["B"] for r in rows)
    calls_l = sum(r["calls"]["Laya"] for r in rows)
    not_worse_b = (sum_l <= sum_b * B_CHARS_SLACK) and (calls_l <= calls_b)

    rtts = [r["rtt_ms"] for r in rows if r["rtt_ms"] > 0]
    if rtts:
        med_rtt_s = statistics.median(rtts) / 1000.0
    else:
        walls = [float(r["daemon_wall_ms"] or 0) for r in rows]
        med_rtt_s = (statistics.median(walls) / 1000.0) if walls else 0.0

    wall_pass = med_rtt_s <= WALL_OVERHEAD_S
    tokens_pass = (save_a >= SAVINGS_A_GE) and not_worse_b
    acc_pass = hits >= HITS_GE
    verdict = wall_pass and tokens_pass and acc_pass

    summary = {
        "prototype": "tools/laya/harness_recortador_git.py",
        "mode": "fixtures_status_diff",
        "use_daemon": use_daemon,
        "hits": hits,
        "n": len(rows),
        "accuracy": round(hits / max(len(rows), 1), 4),
        "median_rtt_s": round(med_rtt_s, 4),
        "save_A": round(save_a, 4),
        "tokens": {"A": sum_a, "B": sum_b, "Laya": sum_l},
        "calls": {"B": calls_b, "Laya": calls_l},
        "thresholds": {
            "hits_ge": HITS_GE,
            "save_A_ge": SAVINGS_A_GE,
            "wall_overhead_s": WALL_OVERHEAD_S,
            "b_chars_slack": B_CHARS_SLACK,
        },
        "pass": {
            "wall": wall_pass,
            "tokens": tokens_pass,
            "accuracy": acc_pass,
            "verdict": verdict,
        },
        "rows": rows,
    }
    OUT.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n==== SUMMARY git harness ====", flush=True)
    print(json.dumps({k: summary[k] for k in summary if k != "rows"}, ensure_ascii=False, indent=2))
    print(f"Wrote {OUT}", flush=True)
    print(f"VERDICT: {'PASS' if verdict else 'FAIL'}", flush=True)
    return 0 if verdict else 1


if __name__ == "__main__":
    raise SystemExit(main())
