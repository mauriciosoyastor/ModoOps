#!/usr/bin/env python3
"""PROTOTYPE: Recortador de sesión sobre status+diff.

Candidatos = paths del working tree. Laya elige ≤2. El agente hace Read.
"""
from __future__ import annotations

import re
import subprocess
import sys
import time
from pathlib import Path

import harness_recortador as H

ROOT = Path(__file__).resolve().parents[2]
TOP_N = 20
DIFF_SUMMARY_LINES = 8
DIFF_SUMMARY_CHARS = 280

# Lista fija de exclusión (spec grill).
_EXCLUDE_NAMES = {
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "harness_last_run.json",
    "measure_grafo_v2_last.json",
    "measure_selector_last.json",
    "demo_eval_live.json",
    "demo_eval_laya_live.json",
}
_EXCLUDE_SUFFIX = (".min.js", ".safetensors", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".woff2")


def norm_path(p: str) -> str:
    return (p or "").replace("\\", "/").lstrip("./")


def is_excluded(path: str) -> bool:
    blob = norm_path(path)
    name = Path(blob).name
    if name in _EXCLUDE_NAMES:
        return True
    low = blob.lower()
    if any(low.endswith(sfx) for sfx in _EXCLUDE_SUFFIX):
        return True
    padded = f"/{low}/"
    markers = (
        "/node_modules/",
        "/.git/",
        "/.models/",
        "/__pycache__/",
        "/web/public/prototype/vendor/",
        "/.astro/",
    )
    if any(m in padded for m in markers):
        return True
    if low.startswith(".venv") or "/.venv" in padded:
        return True
    return False


def priority_for(path: str, status: str) -> float:
    """Heurística: código fuente del repo > docs/locks."""
    p = norm_path(path).lower()
    score = 0.4
    if p.startswith("web/src/") or p.startswith("modoops_") or p.startswith("tools/"):
        score += 0.35
    if p.endswith((".ts", ".tsx", ".py", ".astro", ".js")):
        score += 0.15
    if p.endswith((".md", ".json", ".yml", ".yaml", ".css")):
        score -= 0.1
    if status in ("M", "A", "?"):
        score += 0.05
    if status == "R":
        score += 0.02
    return round(min(score, 0.99), 3)


def cand_id(path: str) -> str:
    return f"file:{norm_path(path)}"


def to_candidate(path: str, status: str, diff_summary: str) -> dict:
    p = norm_path(path)
    return {
        "id": cand_id(p),
        "path": p,
        "status": status,
        "diff_summary": (diff_summary or "")[:DIFF_SUMMARY_CHARS],
        "priority": priority_for(p, status),
        "summary": f"{status} {p}",
    }


def filter_and_rank(raw: list[dict]) -> list[dict]:
    """Exclusiones + top-20 por priority. Acepta dicts con path/status/diff_summary."""
    built: list[dict] = []
    seen: set[str] = set()
    for r in raw:
        p = norm_path(r.get("path") or "")
        if not p or p in seen or is_excluded(p):
            continue
        seen.add(p)
        built.append(
            to_candidate(p, (r.get("status") or "M")[:1], r.get("diff_summary") or "")
        )
    built.sort(key=lambda c: float(c["priority"]), reverse=True)
    return built[:TOP_N]


def serialize_state_git(cands: list[dict], goal: str, query: str = "") -> str:
    lines = [f"goal: {goal}"]
    if query:
        lines.append(f"q: {query}")
    lines.append("files:")
    for i, c in enumerate(cands, 1):
        lines.append(
            f"{i}. {c['path']} | status={c.get('status')} | prio={c.get('priority')}"
        )
        ds = (c.get("diff_summary") or "").replace("\n", " ").strip()
        if ds:
            lines.append(f"  diff: {ds[:180]}")
    return "\n".join(lines)


def expand_git_rows(
    cands: list[dict], expand_ids: list[str], reason: str
) -> tuple[list[dict], str]:
    by_id = {c["id"]: c for c in cands}
    rows: list[dict] = []
    used: set[str] = set()
    for pid in expand_ids:
        if len(rows) >= 2:
            break
        c = by_id.get(pid)
        if not c or pid in used:
            continue
        used.add(pid)
        rows.append(
            {
                "process_id": c["id"],
                "path": c["path"],
                "file": c["path"],
                "symbol": Path(c["path"]).name,
                "status": c.get("status"),
                "skipped": False,
                "summary": c.get("summary"),
                "priority": c.get("priority"),
            }
        )
    return rows, reason


def laya_pick_git(agent, state: str, cands: list[dict]) -> tuple[str | None, dict]:
    """Misma forma que laya_pick (question key `process`) para reusar hybrid_expand_ids."""
    criteria = {c["id"]: c.get("summary") or c["path"] for c in cands}
    if not criteria:
        return None, {"error": "no candidates"}
    questions = {
        "process": {
            "type": "choice",
            "instructions": (
                "Elegí el ARCHIVO del working tree que mejor responde al goal. "
                "Preferí código fuente (.ts/.py/.astro) sobre docs o locks. "
                "Si el goal nombra un símbolo o módulo, preferí el path que lo contiene."
            ),
            "criteria": criteria,
        }
    }
    result = agent.predict(state, questions)
    ans = (result.get("answers") or {}).get("process") or {}
    return ans.get("choice"), result


def pick_from_git_candidates(
    agent, goal: str, query: str, cands: list[dict]
) -> dict:
    if not cands:
        return {
            "goal": goal,
            "query": query,
            "n_candidates": 0,
            "laya_choice": None,
            "hybrid_reason": "empty",
            "expand_ids": [],
            "expand": [],
            "wall_ms": 0.0,
            "skipped_all": True,
            "abort": True,
            "abort_reason": "no_candidates",
            "session_ok": False,
        }
    state = serialize_state_git(cands, goal, query or "")
    t0 = time.perf_counter()
    chosen, laya_raw = laya_pick_git(agent, state, cands)
    expand_ids, reason = H.hybrid_expand_ids(cands, chosen, laya_raw)
    rows, reason2 = expand_git_rows(cands, expand_ids, reason)
    wall_ms = (time.perf_counter() - t0) * 1000.0
    session_ok = bool(rows) and all(not r.get("skipped") for r in rows)
    return {
        "goal": goal,
        "query": query,
        "n_candidates": len(cands),
        "laya_choice": chosen,
        "hybrid_reason": reason2,
        "expand_ids": [r["process_id"] for r in rows],
        "expand": rows,
        "wall_ms": round(wall_ms, 2),
        "state_chars": len(state),
        "skipped_all": False,
        "abort": False,
        "session_ok": session_ok,
    }


class GitCollectError(RuntimeError):
    """git status/diff failed — not the same as a clean working tree."""


def _no_window_kwargs() -> dict:
    """Windows: avoid flashing a console per git.exe invocation."""
    if sys.platform == "win32":
        return {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)}
    return {}


def _run_git(args: list[str], *, cwd: Path | None = None) -> str:
    proc = subprocess.run(
        ["git", *args],
        cwd=str(cwd or ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        **_no_window_kwargs(),
    )
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "").strip()[:400]
        raise GitCollectError(f"git {' '.join(args)} failed ({proc.returncode}): {err}")
    return proc.stdout or ""


def _diff_summary_for(path: str, status: str, *, cwd: Path | None = None) -> str:
    base = cwd or ROOT
    p = norm_path(path)
    if status == "?":
        try:
            text = (base / p).read_text(encoding="utf-8", errors="replace")
        except OSError:
            return "untracked"
        lines = text.splitlines()[:DIFF_SUMMARY_LINES]
        return "untracked\n" + "\n".join(lines)
    try:
        out = _run_git(["diff", "HEAD", "--", p], cwd=base)
        if not out.strip():
            out = _run_git(["diff", "--cached", "HEAD", "--", p], cwd=base)
    except GitCollectError:
        return f"status={status}"
    lines = out.splitlines()[:DIFF_SUMMARY_LINES]
    return "\n".join(lines) if lines else f"status={status}"


_RENAME_RE = re.compile(r"^R(\d*)\s+(.+?)\s+->\s+(.+)$")


def collect_status_diff(root: Path | None = None) -> list[dict]:
    """Working tree vs HEAD: modified, added, untracked, renames → path nuevo.

    Raises GitCollectError if git itself fails (caller must not treat as clean_tree).
    """
    cwd = root or ROOT
    out = _run_git(["status", "--porcelain", "-u"], cwd=cwd)
    raw_rows: list[dict] = []
    for line in out.splitlines():
        if not line.strip():
            continue
        if line[0] == "R" or line.startswith("R "):
            m = _RENAME_RE.match(line.strip())
            if m:
                new_p = m.group(3).strip()
                raw_rows.append(
                    {
                        "path": new_p,
                        "status": "R",
                        "diff_summary": _diff_summary_for(new_p, "R", cwd=cwd),
                    }
                )
                continue
        xy, rest = line[:2], line[3:].strip()
        if " -> " in rest:
            rest = rest.split(" -> ", 1)[-1].strip()
        status = (xy[0] if xy[0] != " " else xy[1]).strip() or "?"
        if xy == "??":
            status = "?"
        path = rest.strip().strip('"')
        if not path:
            continue
        raw_rows.append(
            {
                "path": path,
                "status": status,
                "diff_summary": _diff_summary_for(path, status, cwd=cwd),
            }
        )
    return filter_and_rank(raw_rows)
