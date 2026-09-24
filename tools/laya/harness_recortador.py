#!/usr/bin/env python3
"""Laya helpers compartidos (recortador git / daemon).

Sin motor de grafo de código. El harness de sesión es harness_recortador_git.py.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Hybrid thresholds (grill 2026-09-22; ciclo 1 calib).
PRIO_TIE = 0.02
PROB_TIE = 0.15
SAVINGS_GE = 0.40


def norm_path(p: str) -> str:
    return (p or "").replace("\\", "/").lstrip("./")


def file_matches(sym_path: str, gold_file: str) -> bool:
    a = norm_path(sym_path)
    b = norm_path(gold_file)
    return a == b or a.endswith("/" + b) or a.endswith(b)


def tok(obj) -> int:
    """Proxy chars/4 — mismo criterio que research Laya hasta tokenizer locked."""
    if isinstance(obj, (dict, list)):
        raw = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    else:
        raw = str(obj)
    return max(1, len(raw) // 4)


def short_path(file_path: str) -> str:
    parts = file_path.replace("\\", "/").split("/")
    return "/".join(parts[-2:]) if len(parts) >= 2 else file_path


def serialize_state(cands: list[dict], goal: str, q: str) -> str:
    lines = [f"goal: {goal}", f"q: {q}", "procs:"]
    for i, c in enumerate(cands, 1):
        lines.append(
            f"{i}. {c['id']} | {c['summary']} | prio={c['priority']}"
        )
        for s in c.get("symbols") or []:
            loc = s.get("file_short") or short_path(s.get("file") or "")
            lines.append(f"  - {s['name']} @ {loc}")
    return "\n".join(lines)


def load_laya():
    os.environ.setdefault("USE_TF", "0")
    import laya  # noqa: WPS433 — local optional dep

    local = os.environ.get(
        "LAYA_MODEL_PATH",
        str(ROOT / ".models" / "laya-multilingual"),
    )
    if os.path.isdir(local) and os.path.isfile(os.path.join(local, "model.safetensors")):
        return laya.load(local)
    return laya.load("convaiinnovations/laya", subfolder="multilingual")


def laya_pick(agent, state: str, cands: list[dict]) -> tuple[str | None, dict]:
    criteria = {c["id"]: c["summary"] or c["id"] for c in cands}
    if not criteria:
        return None, {"error": "no candidates"}
    questions = {
        "process": {
            "type": "choice",
            "instructions": (
                "Elegí el candidato que mejor responde al goal. "
                "Si el goal nombra un path o símbolo concreto, preferí "
                "el candidato cuyo summary o path lo incluye."
            ),
            "criteria": criteria,
        }
    }
    result = agent.predict(state, questions)
    ans = (result.get("answers") or {}).get("process") or {}
    choice = ans.get("choice")
    return choice, result


def hybrid_expand_ids(
    cands: list[dict], chosen: str | None, laya_raw: dict
) -> tuple[list[str], str]:
    """Return ids to expand (1 or 2) and trigger reason."""
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


def main() -> int:
    print(
        "Harness grafo retirado. Usá:\n"
        "  .\\.venv-win\\Scripts\\python.exe tools\\laya\\harness_recortador_git.py",
        flush=True,
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
