#!/usr/bin/env python3
"""PROTOTYPE (#202): measure Recortador v2 vs umbrales #201.

Assumes daemon_http.py already warm. Client: one GitNexus query + POST candidates.

Thresholds (#201):
  Wall-warm overhead vs B ≤ 2s (here: daemon RTT; B has 0 Laya wall)
  Ahorro-A ≥ 40%
  not worse than B: chars/4 ≤ 1.05×B and calls ≤ B (calls ≈ 1 query + N context)
  hits ≥ 4/5; skipped rate ≤ 20% of expand rows
"""
from __future__ import annotations

import json
import os
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

URL = os.environ.get("LAYA_DAEMON_URL", "http://127.0.0.1:8765/v1/recortar")
OUT = _DIR / "measure_grafo_v2_last.json"
WALL_OVERHEAD_S = 2.0
SAVINGS_A_GE = 0.40
B_CHARS_SLACK = 1.05
HITS_GE = 4
SKIPPED_RATE_LE = 0.20


def post(body: dict) -> tuple[dict, float]:
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        URL, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    t0 = time.perf_counter()
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw), (time.perf_counter() - t0) * 1000.0


def ctx_tokens_for_pids(payload: dict, pids: list[str]) -> tuple[int, int, int]:
    """Returns (tokens, n_context_calls, n_skipped)."""
    cands = [
        c
        for c in H.compact_candidates(payload, "", "")
        if c["id"] in set(pids)
    ]
    # Preserve order of pids
    by_id = {c["id"]: c for c in cands}
    ordered = [by_id[p] for p in pids if p in by_id]
    if not ordered:
        return 0, 0, len(pids)
    tok_sum, details = H.expand_contexts(ordered, payload)
    skipped = sum(1 for d in details if d.get("skipped"))
    calls = sum(1 for d in details if not d.get("skipped"))
    return tok_sum, calls, skipped


def main() -> int:
    try:
        urllib.request.urlopen(
            URL.replace("/v1/recortar", "/health"), timeout=3
        )
    except Exception:
        # health path
        try:
            urllib.request.urlopen("http://127.0.0.1:8765/health", timeout=3)
        except Exception as e:
            print(f"ERROR: daemon not up ({e}). Start daemon_http.py first.", file=sys.stderr)
            return 2

    archetypes = json.loads(H.ARCHETYPES.read_text(encoding="utf-8"))
    rows = []
    expand_rows = 0
    skipped_rows = 0

    for a in archetypes:
        print(f"=== #{a['id']} {a['goal'][:60]}… ===", flush=True)
        payload = H.query(a["query"], a["goal"])
        q_tok = H.tok(
            {
                "processes": payload.get("processes"),
                "process_symbols": payload.get("process_symbols"),
            }
        )
        cands = H.compact_candidates(payload, a["goal"], a["query"])
        gold_pids = H.gold_process_ids(a["gold_symbol"], a["gold_file"], payload)

        # A = all candidates
        all_ids = [c["id"] for c in cands]
        a_ctx, a_calls, _ = ctx_tokens_for_pids(payload, all_ids)
        a_total = q_tok + a_ctx
        a_tool_calls = 1 + a_calls  # query + contexts

        # B = top-2 by priority (disciplined, no Laya)
        ranked = sorted(cands, key=lambda c: float(c.get("priority") or 0), reverse=True)
        b_ids = [c["id"] for c in ranked[:2]]
        b_ctx, b_calls, _ = ctx_tokens_for_pids(payload, b_ids)
        b_total = q_tok + b_ctx
        b_tool_calls = 1 + b_calls

        # Laya via daemon (no second query)
        try:
            out, rtt_ms = post(
                {"goal": a["goal"], "query": a["query"], "candidates": cands}
            )
        except urllib.error.URLError as e:
            print(f"  FAIL post: {e}", flush=True)
            return 2

        expand_ids = out.get("expand_ids") or [
            e.get("process_id") for e in (out.get("expand") or []) if e.get("process_id")
        ]
        for ex in out.get("expand") or []:
            expand_rows += 1
            if ex.get("skipped"):
                skipped_rows += 1

        l_ctx, l_calls, _ = ctx_tokens_for_pids(payload, list(expand_ids))
        l_total = q_tok + l_ctx
        l_tool_calls = 1 + l_calls  # query once + contexts; daemon not a "token" tool

        hit = bool(set(expand_ids) & gold_pids)
        save_a = (a_total - l_total) / a_total if a_total else 0.0
        print(
            f"  rtt={rtt_ms:.0f}ms daemon_wall={out.get('wall_ms')} "
            f"hit={hit} save_a={save_a:.1%} "
            f"tok A/B/L={a_total}/{b_total}/{l_total}",
            flush=True,
        )
        rows.append(
            {
                "id": a["id"],
                "hit": hit,
                "rtt_ms": round(rtt_ms, 2),
                "daemon_wall_ms": out.get("wall_ms"),
                "expand_ids": expand_ids,
                "hybrid_reason": out.get("hybrid_reason"),
                "tokens": {
                    "query": q_tok,
                    "A": a_total,
                    "B": b_total,
                    "Laya": l_total,
                    "save_A": round(save_a, 4),
                },
                "calls": {"A": a_tool_calls, "B": b_tool_calls, "Laya": l_tool_calls},
            }
        )

    hits = sum(1 for r in rows if r["hit"])
    rtts = [r["rtt_ms"] for r in rows]
    med_rtt_s = statistics.median(rtts) / 1000.0
    # B has 0 Laya overhead → overhead = median RTT
    wall_pass = med_rtt_s <= WALL_OVERHEAD_S

    sum_a = sum(r["tokens"]["A"] for r in rows)
    sum_b = sum(r["tokens"]["B"] for r in rows)
    sum_l = sum(r["tokens"]["Laya"] for r in rows)
    save_a = (sum_a - sum_l) / sum_a if sum_a else 0.0
    calls_b = sum(r["calls"]["B"] for r in rows)
    calls_l = sum(r["calls"]["Laya"] for r in rows)
    not_worse_b = (sum_l <= sum_b * B_CHARS_SLACK) and (calls_l <= calls_b)
    tokens_pass = (save_a >= SAVINGS_A_GE) and not_worse_b

    skipped_rate = (skipped_rows / expand_rows) if expand_rows else 0.0
    acc_pass = hits >= HITS_GE and skipped_rate <= SKIPPED_RATE_LE

    verdict = wall_pass and tokens_pass and acc_pass
    summary = {
        "prototype": "tools/laya/measure_grafo_v2.py",
        "ticket": 202,
        "daemon_url": URL,
        "hits": hits,
        "n": len(rows),
        "skipped_rate": round(skipped_rate, 4),
        "median_rtt_s": round(med_rtt_s, 4),
        "save_A": round(save_a, 4),
        "tokens": {"A": sum_a, "B": sum_b, "Laya": sum_l},
        "calls": {"B": calls_b, "Laya": calls_l},
        "thresholds": {
            "wall_overhead_s": WALL_OVERHEAD_S,
            "save_A_ge": SAVINGS_A_GE,
            "b_chars_slack": B_CHARS_SLACK,
            "hits_ge": HITS_GE,
            "skipped_rate_le": SKIPPED_RATE_LE,
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
    print("\n==== SUMMARY #202 ====", flush=True)
    print(json.dumps({k: summary[k] for k in summary if k != "rows"}, ensure_ascii=False, indent=2))
    print(f"Wrote {OUT}", flush=True)
    print(f"VERDICT: {'PASS' if verdict else 'FAIL'}", flush=True)
    return 0 if verdict else 1


if __name__ == "__main__":
    sys.exit(main())
