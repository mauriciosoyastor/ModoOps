#!/usr/bin/env python3
"""PROTOTYPE (#197): query → Laya recortador (+ híbrido expand-2) → context.

Throwaway. Tokens = chars/4 of tool JSON payloads (Cursor-agent proxy).
Gold = gold_symbol@gold_file (ciclo 0). Hit = symbol in an expanded process.
Savings threshold ≥40%.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

REPO = "ModoOps"
ROOT = Path(__file__).resolve().parents[2]
ARCHETYPES = Path(__file__).with_name("archetypes.json")
LIMIT = 10
MAX_SYMS = 3


def norm_path(p: str) -> str:
    return (p or "").replace("\\", "/").lstrip("./")


def file_matches(sym_path: str, gold_file: str) -> bool:
    a = norm_path(sym_path)
    b = norm_path(gold_file)
    return a == b or a.endswith("/" + b) or a.endswith(b)


def _gitnexus_cmd() -> list[str]:
    """Resolve gitnexus CLI for Windows (npm shim is .cmd/.ps1, not bare name)."""
    env_bin = os.environ.get("GITNEXUS_BIN")
    if env_bin:
        return [env_bin]
    npm = Path(os.environ.get("APPDATA", "")) / "npm"
    cli = npm / "node_modules" / "gitnexus" / "dist" / "cli" / "index.js"
    if cli.is_file():
        return ["node", str(cli)]
    cmd = npm / "gitnexus.cmd"
    if cmd.is_file():
        return [str(cmd)]
    return ["gitnexus"]


GITNEXUS_CMD = _gitnexus_cmd()


def tok(obj) -> int:
    """Proxy chars/4 — same as research #193 until tokenizer is locked."""
    if isinstance(obj, (dict, list)):
        raw = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    else:
        raw = str(obj)
    return max(1, len(raw) // 4)


def run_gitnexus(args: list[str]) -> dict:
    proc = subprocess.run(
        [*GITNEXUS_CMD, *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        shell=False,
    )
    out = (proc.stdout or "").strip()
    if not out:
        raise RuntimeError(f"gitnexus {' '.join(args)} empty stdout\n{proc.stderr[-800:]}")
    # CLI may print log lines before JSON; take last {...} block.
    start = out.find("{")
    if start < 0:
        raise RuntimeError(f"no JSON in stdout for {args}: {out[:400]}")
    return json.loads(out[start:])


def query(q: str, goal: str) -> dict:
    return run_gitnexus(
        ["query", q, "--repo", REPO, "--limit", str(LIMIT), "--goal", goal]
    )


def context(name: str, file_path: str | None = None) -> dict:
    args = ["context", name, "--repo", REPO, "--limit", "20"]
    if file_path:
        args.extend(["--file", file_path])
    return run_gitnexus(args)


def short_path(file_path: str) -> str:
    parts = file_path.replace("\\", "/").split("/")
    return "/".join(parts[-2:]) if len(parts) >= 2 else file_path


def compact_candidates(payload: dict, goal: str, q: str) -> list[dict]:
    procs = payload.get("processes") or []
    syms = payload.get("process_symbols") or []
    by_pid: dict[str, list[dict]] = {}
    for s in syms:
        pid = s.get("process_id")
        if not pid:
            continue
        by_pid.setdefault(pid, []).append(s)

    out = []
    for p in procs[:LIMIT]:
        pid = p["id"]
        attached = sorted(by_pid.get(pid, []), key=lambda s: s.get("step_index", 99))[:MAX_SYMS]
        out.append(
            {
                "id": pid,
                "summary": (p.get("summary") or "")[:80],
                "priority": round(float(p.get("priority") or 0), 3),
                # Full filePath for context(--file); short kept for compact state (#206).
                "symbols": [
                    {
                        "name": s.get("name"),
                        "file": s.get("filePath") or "",
                        "file_short": short_path(s.get("filePath") or ""),
                    }
                    for s in attached
                ],
            }
        )
    # #206: recover symbols for processes with empty attach via summary/id name match.
    pool = [s for c in out for s in c["symbols"]]
    for c in out:
        if c["symbols"]:
            continue
        blob = f"{c['summary']} {c['id']}".lower()
        for s in pool:
            name = (s.get("name") or "").lower()
            if name and len(name) >= 3 and name in blob:
                c["symbols"] = [dict(s)]
                break
    return out


def serialize_state(cands: list[dict], goal: str, q: str) -> str:
    lines = [f"goal: {goal}", f"q: {q}", "procs:"]
    for i, c in enumerate(cands, 1):
        lines.append(
            f"{i}. {c['id']} | {c['summary']} | prio={c['priority']}"
        )
        for s in c["symbols"]:
            loc = s.get("file_short") or short_path(s.get("file") or "")
            lines.append(f"  - {s['name']} @ {loc}")
    return "\n".join(lines)


def primary_symbol(cand: dict) -> tuple[str | None, str | None]:
    if not cand["symbols"]:
        return None, None
    s0 = cand["symbols"][0]
    # Need full path for --file; recover from short is lossy — re-query from payload later.
    return s0.get("name"), None


def expand_contexts(cands: list[dict], full_payload: dict) -> tuple[int, list[dict]]:
    """Sum context tokens for each candidate's first symbol."""
    syms = full_payload.get("process_symbols") or []
    by_pid: dict[str, list[dict]] = {}
    for s in syms:
        pid = s.get("process_id")
        if pid:
            by_pid.setdefault(pid, []).append(s)

    total = 0
    details = []
    for c in cands:
        attached = sorted(by_pid.get(c["id"], []), key=lambda s: s.get("step_index", 99))
        if not attached:
            details.append({"process_id": c["id"], "skipped": True, "tokens": 0})
            continue
        s0 = attached[0]
        name = s0.get("name")
        fpath = s0.get("filePath")
        try:
            ctx = context(name, fpath)
            t = tok(ctx)
        except Exception as e:  # noqa: BLE001 — prototype
            ctx = {"error": str(e)}
            t = tok(ctx)
        total += t
        details.append({"process_id": c["id"], "symbol": name, "tokens": t})
    return total, details


def load_laya():
    os.environ.setdefault("USE_TF", "0")
    import laya  # noqa: WPS433 — local optional dep

    # Prefer local checkpoint (manual HF download). Fallback: hub multilingual.
    local = os.environ.get(
        "LAYA_MODEL_PATH",
        str(ROOT / ".models" / "laya-multilingual"),
    )
    if os.path.isdir(local) and os.path.isfile(os.path.join(local, "model.safetensors")):
        return laya.load(local)
    # Direct multilingual load — do not rely on Router auto (#194).
    return laya.load("convaiinnovations/laya", subfolder="multilingual")


def laya_pick(agent, state: str, cands: list[dict]) -> tuple[str | None, dict]:
    criteria = {c["id"]: c["summary"] or c["id"] for c in cands}
    if not criteria:
        return None, {"error": "no candidates"}
    questions = {
        "process": {
            "type": "choice",
            "instructions": (
                "Elegí el proceso del grafo que mejor responde al goal. "
                "Si el goal nombra un símbolo concreto, preferí el proceso "
                "cuyo summary o símbolos listados lo incluyen "
                "(ej. esAncla vs horasDe)."
            ),
            "criteria": criteria,
        }
    }
    result = agent.predict(state, questions)
    ans = (result.get("answers") or {}).get("process") or {}
    choice = ans.get("choice")
    return choice, result


# Hybrid thresholds (grill 2026-09-22; ciclo 1 calib).
PRIO_TIE = 0.02
PROB_TIE = 0.15
SAVINGS_GE = 0.40


def hybrid_expand_ids(
    cands: list[dict], chosen: str | None, laya_raw: dict
) -> tuple[list[str], str]:
    """Return process ids to expand (1 or 2) and trigger reason."""
    if not cands:
        return [], "empty"
    by_id = {c["id"]: c for c in cands}
    ranked = sorted(cands, key=lambda c: float(c.get("priority") or 0), reverse=True)

    ans = (laya_raw.get("answers") or {}).get("process") or {}
    probs = ans.get("probabilities") or {}
    expand_two = False
    reason = "single"

    if len(ranked) >= 2:
        dprio = abs(float(ranked[0]["priority"]) - float(ranked[1]["priority"]))
        if dprio < PRIO_TIE:
            expand_two = True
            reason = f"prio_tie:{dprio:.4f}"

    if not expand_two and isinstance(probs, dict) and len(probs) >= 2:
        top2 = sorted(probs.items(), key=lambda kv: float(kv[1]), reverse=True)[:2]
        dp = abs(float(top2[0][1]) - float(top2[1][1]))
        if dp < PROB_TIE:
            expand_two = True
            reason = f"prob_tie:{dp:.4f}"

    if not expand_two:
        if chosen and chosen in by_id:
            return [chosen], reason
        return ([ranked[0]["id"]] if ranked else []), reason

    def add(pid: str | None, dest: list[str]) -> None:
        if pid and pid in by_id and pid not in dest:
            dest.append(pid)

    ordered: list[str] = []

    # prio_tie: keep Laya choice + near-tied peer by query prio (siblings like 54/55).
    if reason.startswith("prio_tie") and chosen and chosen in by_id:
        add(chosen, ordered)
        cp = float(by_id[chosen]["priority"])
        peers = sorted(
            (
                c
                for c in ranked
                if c["id"] != chosen
                and abs(float(c["priority"]) - cp) < PRIO_TIE
            ),
            key=lambda c: float(c["priority"]),
            reverse=True,
        )
        if peers:
            add(peers[0]["id"], ordered)
        if len(ordered) >= 2:
            return ordered[:2], reason

    # prob_tie (or prio_tie without peer): Laya top-2, then fill from query rank.
    if isinstance(probs, dict):
        for pid, _ in sorted(probs.items(), key=lambda kv: float(kv[1]), reverse=True):
            add(pid, ordered)
            if len(ordered) >= 2:
                return ordered[:2], reason
    for c in ranked:
        add(c["id"], ordered)
        if len(ordered) >= 2:
            break
    return ordered[:2], reason


def gold_process_ids(gold_symbol: str, gold_file: str, payload: dict) -> set[str]:
    """Resolve gold via context(symbol, file); fall back to query payload symbols."""
    out: set[str] = set()
    try:
        ctx = context(gold_symbol, gold_file)
        for p in ctx.get("processes") or []:
            pid = p.get("id")
            if pid:
                out.add(pid)
        # Ambiguous CLI shape may list candidates without processes — ignore.
    except Exception:  # noqa: BLE001 — prototype
        pass
    for s in payload.get("process_symbols") or []:
        if s.get("name") != gold_symbol:
            continue
        if not file_matches(s.get("filePath") or "", gold_file):
            continue
        pid = s.get("process_id")
        if pid:
            out.add(pid)
    return out


def main() -> int:
    archetypes = json.loads(ARCHETYPES.read_text(encoding="utf-8"))
    print("PROTOTYPE harness_recortador — loading Laya multilingual…", flush=True)
    agent = load_laya()
    print("Laya ready.\n", flush=True)

    rows = []
    for a in archetypes:
        gold_sym = a["gold_symbol"]
        gold_file = a["gold_file"]
        gold_label = f"{gold_sym}@{gold_file}"
        print(f"=== #{a['id']} {a['goal']} ===", flush=True)
        payload = query(a["query"], a["goal"])
        q_tokens = tok(
            {
                "processes": payload.get("processes"),
                "process_symbols": payload.get("process_symbols"),
            }
        )
        cands = compact_candidates(payload, a["goal"], a["query"])
        gold_pids = gold_process_ids(gold_sym, gold_file, payload)
        cand_ids = {c["id"] for c in cands}
        gold_in = bool(gold_pids & cand_ids)
        print(
            f"  candidates={len(cands)} gold_in_top={gold_in} "
            f"gold_pids={sorted(gold_pids) or '-'} query_tok~={q_tokens}",
            flush=True,
        )

        # --- baseline: expand all ---
        base_ctx_tok, base_details = expand_contexts(cands, payload)
        baseline_tok = q_tokens + base_ctx_tok

        # --- laya + hybrid: pick 1 or 2 ---
        state = serialize_state(cands, a["goal"], a["query"])
        state_tok = tok(state)
        chosen, laya_raw = laya_pick(agent, state, cands)
        expand_ids, hybrid_reason = hybrid_expand_ids(cands, chosen, laya_raw)
        winners = [c for c in cands if c["id"] in expand_ids]
        # Hit = gold symbol appears on any expanded process (Q16-A).
        pick_ok = bool(gold_pids & set(expand_ids))
        print(
            f"  laya_choice={chosen} expand={expand_ids} ({hybrid_reason}) "
            f"gold={gold_label} hit={pick_ok}",
            flush=True,
        )

        laya_ctx_tok = 0
        if winners:
            win_ids = {w["id"] for w in winners}
            slim = {
                "process_symbols": [
                    s
                    for s in (payload.get("process_symbols") or [])
                    if s.get("process_id") in win_ids
                ]
            }
            laya_ctx_tok, _ = expand_contexts(winners, {**payload, **slim})
        # Primary agent tokens = query + expanded context(s); state is Laya-only.
        laya_agent_tok = q_tokens + laya_ctx_tok
        laya_with_state_tok = q_tokens + state_tok + laya_ctx_tok

        save = 0.0
        if baseline_tok > 0:
            save = (baseline_tok - laya_agent_tok) / baseline_tok

        rows.append(
            {
                "id": a["id"],
                "goal": a["goal"],
                "gold_symbol": gold_sym,
                "gold_file": gold_file,
                "gold_process_ids": sorted(gold_pids),
                "chosen": chosen,
                "expand_ids": expand_ids,
                "hybrid_reason": hybrid_reason,
                "hit": pick_ok,
                "gold_in_candidates": gold_in,
                "n_candidates": len(cands),
                "tokens": {
                    "query": q_tokens,
                    "baseline_contexts": base_ctx_tok,
                    "baseline_total": baseline_tok,
                    "state": state_tok,
                    "laya_context": laya_ctx_tok,
                    "laya_agent_total": laya_agent_tok,
                    "laya_with_state_total": laya_with_state_tok,
                },
                "savings_vs_baseline": round(save, 4),
                "baseline_expand": base_details,
            }
        )

    hits = sum(1 for r in rows if r["hit"])
    base_sum = sum(r["tokens"]["baseline_total"] for r in rows)
    laya_sum = sum(r["tokens"]["laya_agent_total"] for r in rows)
    savings = (base_sum - laya_sum) / base_sum if base_sum else 0.0
    pass_acc = hits >= 4
    pass_save = savings >= SAVINGS_GE
    verdict = pass_acc and pass_save

    summary = {
        "prototype": "tools/laya/harness_recortador.py",
        "ticket": 197,
        "mode": "ciclo3_substitute_5_hub_copy",
        "token_unit": "chars/4",
        "hits": hits,
        "n": len(rows),
        "accuracy": round(hits / len(rows), 3),
        "baseline_tokens": base_sum,
        "laya_agent_tokens": laya_sum,
        "marginal_savings": round(savings, 4),
        "thresholds": {"hits_ge": 4, "savings_ge": SAVINGS_GE},
        "pass_accuracy": pass_acc,
        "pass_savings": pass_save,
        "verdict_pass": verdict,
        "rows": rows,
    }

    out_path = Path(__file__).with_name("harness_last_run.json")
    out_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n==== SUMMARY ====", flush=True)
    print(json.dumps({k: summary[k] for k in summary if k != "rows"}, ensure_ascii=False, indent=2))
    print(f"\nWrote {out_path}", flush=True)
    print(
        f"VERDICT: {'PASS' if verdict else 'FAIL'} "
        f"(hits {hits}/5, savings {savings:.1%})",
        flush=True,
    )
    return 0 if verdict else 1


if __name__ == "__main__":
    sys.exit(main())
