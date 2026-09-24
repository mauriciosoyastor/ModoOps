#!/usr/bin/env python3
"""Path B: candidatos del Índice de código (code-review-graph) → forma Laya git.

No muta path A (status+diff). El cliente POSTea a /v1/recortar-git.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import recortar_git as RG

ROOT = Path(__file__).resolve().parents[2]
TOP_N = 20


class IndiceCollectError(RuntimeError):
    """CLI code-review-graph falló o devolvió JSON inválido."""


def to_repo_rel(file_path: str, root: Path | None = None) -> str:
    base = (root or ROOT).resolve()
    raw = (file_path or "").strip().strip('"')
    if not raw:
        return ""
    p = Path(raw)
    try:
        if p.is_absolute():
            return p.resolve().relative_to(base).as_posix()
    except ValueError:
        pass
    # Strip drive-absolute prefix that already contains repo path segments
    norm = RG.norm_path(raw)
    base_s = base.as_posix().lower()
    low = norm.lower()
    if low.startswith(base_s):
        return RG.norm_path(norm[len(base_s) :].lstrip("/"))
    # Windows path with forward slashes containing ModoOps/
    marker = "/modoops/"
    idx = low.rfind(marker)
    if idx >= 0:
        return RG.norm_path(norm[idx + len(marker) :])
    return norm


def search_results_to_raw(payload: dict, root: Path | None = None) -> list[dict]:
    """CRG `search` JSON → list[{path,status,diff_summary}] para filter_and_rank."""
    rows: list[dict] = []
    seen: set[str] = set()
    for r in payload.get("results") or []:
        fp = r.get("file_path") or r.get("qualified_name") or ""
        rel = to_repo_rel(str(fp), root)
        if not rel or rel in seen:
            continue
        if RG.is_excluded(rel):
            continue
        seen.add(rel)
        kind = r.get("kind") or ""
        name = r.get("name") or ""
        score = float(r.get("score") or 0)
        sig = (r.get("signature") or "")[:120]
        summary = f"{kind} {name}".strip()
        if sig:
            summary = f"{summary} | {sig}"
        rows.append(
            {
                "path": rel,
                "status": "I",  # Índice
                "diff_summary": summary[: RG.DIFF_SUMMARY_CHARS],
                "_score": score,
            }
        )
    # Prefer higher FTS score before filter_and_rank heuristics
    rows.sort(key=lambda x: float(x.get("_score") or 0), reverse=True)
    for r in rows:
        r.pop("_score", None)
    return rows


def candidates_from_search_payload(payload: dict, root: Path | None = None) -> list[dict]:
    raw = search_results_to_raw(payload, root)
    cands = RG.filter_and_rank(raw)
    # Bump priority with search rank order (already sorted by score)
    for i, c in enumerate(cands):
        c["priority"] = round(min(0.99, float(c["priority"]) + max(0, 0.2 - i * 0.01)), 3)
        c["summary"] = f"I {c['path']}"
        if c.get("diff_summary"):
            c["summary"] = f"I {c['path']} | {c['diff_summary'][:80]}"
    return cands[:TOP_N]


def _no_window_kwargs() -> dict:
    if sys.platform == "win32":
        return {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)}
    return {}


def run_crg_search(query: str, *, limit: int = TOP_N, root: Path | None = None) -> dict:
    cwd = root or ROOT
    proc = subprocess.run(
        ["code-review-graph", "search", query, "--limit", str(limit)],
        cwd=str(cwd),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=60.0,
        **_no_window_kwargs(),
    )
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "").strip()[:400]
        raise IndiceCollectError(f"code-review-graph search failed: {err}")
    out = (proc.stdout or "").strip()
    if not out:
        raise IndiceCollectError("code-review-graph search empty stdout")
    start = out.find("{")
    if start < 0:
        raise IndiceCollectError(f"no JSON in search stdout: {out[:200]}")
    return json.loads(out[start:])


def collect_indice(query: str, root: Path | None = None) -> list[dict]:
    """Search Índice → ≤TOP_N candidatos forma git."""
    q = (query or "").strip()
    if not q:
        return []
    payload = run_crg_search(q, root=root)
    return candidates_from_search_payload(payload, root)
