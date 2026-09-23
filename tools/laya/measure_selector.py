#!/usr/bin/env python3
"""PROTOTYPE (#203): measure Selector Matt/skills vs umbrales #201.

Daemon must be warm (POST /v1/seleccionar). Baselines:
  A = leer blurbs de TODAS las skills (chars/4)
  B = top-2 por overlap de keywords del pedido (sin Laya)
  Laya = 1 skill vía daemon
"""
from __future__ import annotations

import json
import os
import re
import statistics
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

_DIR = Path(__file__).resolve().parent
URL = os.environ.get("LAYA_DAEMON_SELECT_URL", "http://127.0.0.1:8765/v1/seleccionar")
SKILLS = json.loads((_DIR / "selector_skills.json").read_text(encoding="utf-8"))
ARCH = json.loads((_DIR / "selector_archetypes.json").read_text(encoding="utf-8"))
OUT = _DIR / "measure_selector_last.json"

WALL_OVERHEAD_S = 2.0
SAVINGS_A_GE = 0.40
B_CHARS_SLACK = 1.05
HITS_GE = 4
SKIPPED_RATE_LE = 0.20


def tok(obj) -> int:
    if isinstance(obj, (dict, list)):
        raw = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    else:
        raw = str(obj)
    return max(1, len(raw) // 4)


def keywords(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-záéíóúñ0-9]{4,}", text.lower())}


def rank_b(pedido: str, contexto: str, skills: list[dict]) -> list[dict]:
    bag = keywords(pedido + " " + contexto)
    scored = []
    for s in skills:
        sb = keywords(s["id"] + " " + (s.get("blurb") or ""))
        scored.append((len(bag & sb), s))
    scored.sort(key=lambda x: (-x[0], x[1]["id"]))
    return [s for _, s in scored[:2]]


def post(body: dict) -> tuple[dict, float]:
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        URL, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    t0 = time.perf_counter()
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw), (time.perf_counter() - t0) * 1000.0


def main() -> int:
    try:
        urllib.request.urlopen("http://127.0.0.1:8765/health", timeout=3)
    except Exception as e:
        print(f"ERROR: daemon down ({e})", file=sys.stderr)
        return 2

    rows = []
    skipped_n = 0
    for a in ARCH:
        pedido, ctx, gold = a["pedido"], a.get("contexto") or "", a["gold"]
        print(f"=== #{a['id']} gold={gold} ===", flush=True)

        a_payload = {"skills": SKILLS}
        a_tok = tok(a_payload) + tok({"pedido": pedido, "contexto": ctx})
        a_calls = len(SKILLS)  # would Read each skill

        b_skills = rank_b(pedido, ctx, SKILLS)
        b_tok = tok({"skills": b_skills}) + tok({"pedido": pedido, "contexto": ctx})
        b_calls = len(b_skills)

        try:
            out, rtt = post(
                {"pedido": pedido, "contexto": ctx, "skills": SKILLS}
            )
        except urllib.error.URLError as e:
            print(f"  post fail: {e}", flush=True)
            return 2

        choice = out.get("choice")
        skipped = bool(out.get("skipped"))
        if skipped:
            skipped_n += 1
        hit = choice == gold
        l_skill = next((s for s in SKILLS if s["id"] == choice), None)
        l_tok = tok({"skill": l_skill or choice}) + tok({"pedido": pedido, "contexto": ctx})
        l_calls = 1  # one skill Read after select (+ daemon not counted as Read)

        save_a = (a_tok - l_tok) / a_tok if a_tok else 0.0
        print(
            f"  choice={choice} hit={hit} skipped={skipped} "
            f"rtt={rtt:.0f}ms save_a={save_a:.1%} tok A/B/L={a_tok}/{b_tok}/{l_tok}",
            flush=True,
        )
        rows.append(
            {
                "id": a["id"],
                "gold": gold,
                "choice": choice,
                "hit": hit,
                "skipped": skipped,
                "rtt_ms": round(rtt, 2),
                "daemon_wall_ms": out.get("wall_ms"),
                "tokens": {"A": a_tok, "B": b_tok, "Laya": l_tok, "save_A": round(save_a, 4)},
                "calls": {"A": a_calls, "B": b_calls, "Laya": l_calls},
                "b_ids": [s["id"] for s in b_skills],
            }
        )

    hits = sum(1 for r in rows if r["hit"])
    med_rtt_s = statistics.median([r["rtt_ms"] for r in rows]) / 1000.0
    wall_pass = med_rtt_s <= WALL_OVERHEAD_S
    sum_a = sum(r["tokens"]["A"] for r in rows)
    sum_b = sum(r["tokens"]["B"] for r in rows)
    sum_l = sum(r["tokens"]["Laya"] for r in rows)
    save_a = (sum_a - sum_l) / sum_a if sum_a else 0.0
    calls_b = sum(r["calls"]["B"] for r in rows)
    calls_l = sum(r["calls"]["Laya"] for r in rows)
    not_worse_b = (sum_l <= sum_b * B_CHARS_SLACK) and (calls_l <= calls_b)
    tokens_pass = (save_a >= SAVINGS_A_GE) and not_worse_b
    skipped_rate = skipped_n / len(rows) if rows else 0.0
    acc_pass = hits >= HITS_GE and skipped_rate <= SKIPPED_RATE_LE
    verdict = wall_pass and tokens_pass and acc_pass

    summary = {
        "prototype": "tools/laya/measure_selector.py",
        "ticket": 203,
        "hits": hits,
        "n": len(rows),
        "skipped_rate": round(skipped_rate, 4),
        "median_rtt_s": round(med_rtt_s, 4),
        "save_A": round(save_a, 4),
        "tokens": {"A": sum_a, "B": sum_b, "Laya": sum_l},
        "calls": {"B": calls_b, "Laya": calls_l},
        "pass": {
            "wall": wall_pass,
            "tokens": tokens_pass,
            "accuracy": acc_pass,
            "verdict": verdict,
        },
        "rows": rows,
    }
    OUT.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n==== SUMMARY #203 ====", flush=True)
    print(json.dumps({k: summary[k] for k in summary if k != "rows"}, ensure_ascii=False, indent=2))
    print(f"VERDICT: {'PASS' if verdict else 'FAIL'}", flush=True)
    return 0 if verdict else 1


if __name__ == "__main__":
    sys.exit(main())
