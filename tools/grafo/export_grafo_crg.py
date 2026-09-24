#!/usr/bin/env python3
"""Export Índice CRG → GrafoData (scope A: file-level nodes/edges).

  .\\.venv-win\\Scripts\\python.exe tools\\grafo\\export_grafo_crg.py

Reads `.code-review-graph/graph.json` (runs `visualize --mode file --format json` if missing),
writes `web/public/grafo-data.json` and regenerates `web/src/lib/grafo/data.ts`.
communities/processes stay empty (no invention).
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CRG_JSON = ROOT / ".code-review-graph" / "graph.json"
OUT_JSON = ROOT / "web" / "public" / "grafo-data.json"
OUT_TS = ROOT / "web" / "src" / "lib" / "grafo" / "data.ts"


def to_repo_rel(path: str, root: Path = ROOT) -> str:
    raw = (path or "").strip().strip('"').replace("\\", "/")
    if not raw:
        return ""
    # Strip ::symbol suffix from qualified paths
    if "::" in raw:
        raw = raw.split("::", 1)[0]
    p = Path(raw)
    try:
        if p.is_absolute():
            return p.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        pass
    base = root.resolve().as_posix().lower()
    low = raw.lower()
    if low.startswith(base):
        return raw[len(str(root.resolve())) :].lstrip("/\\").replace("\\", "/")
    marker = "/modoops/"
    idx = low.rfind(marker)
    if idx >= 0:
        return raw[idx + len(marker) :].lstrip("/")
    if not Path(raw).is_absolute():
        return raw.lstrip("./")
    return ""


def ensure_crg_json(*, force: bool = False) -> Path:
    if CRG_JSON.is_file() and not force:
        return CRG_JSON
    subprocess.run(
        ["code-review-graph", "visualize", "--mode", "file", "--format", "json"],
        cwd=str(ROOT),
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        **(
            {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)}
            if sys.platform == "win32"
            else {}
        ),
    )
    if not CRG_JSON.is_file():
        raise FileNotFoundError(f"missing {CRG_JSON} after visualize")
    return CRG_JSON


def git_commit(root: Path = ROOT) -> str:
    try:
        out = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=str(root),
            text=True,
            encoding="utf-8",
            errors="replace",
            **(
                {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)}
                if sys.platform == "win32"
                else {}
            ),
        )
        return out.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def build_grafo_payload(raw: dict, *, root: Path = ROOT, commit: str | None = None) -> dict:
    """Pure mapping CRG visualize JSON → GrafoData (scope A)."""
    q_to_file: dict[str, str] = {}
    file_ids: set[str] = set()

    for n in raw.get("nodes") or []:
        kind = n.get("kind") or ""
        fp = to_repo_rel(str(n.get("file_path") or ""), root)
        qn = str(n.get("qualified_name") or n.get("name") or "")
        rel_q = to_repo_rel(qn, root)
        if kind == "File":
            rid = fp or rel_q
            if rid:
                file_ids.add(rid)
                q_to_file[qn] = rid
                q_to_file[rid] = rid
                if fp:
                    q_to_file[fp] = rid
        else:
            if fp:
                file_ids.add(fp)
                if qn:
                    q_to_file[qn] = fp
                if rel_q:
                    q_to_file[rel_q] = fp

    def resolve_file(ref: str) -> str:
        if not ref:
            return ""
        if ref in q_to_file:
            return q_to_file[ref]
        rel = to_repo_rel(ref, root)
        if rel in q_to_file:
            return q_to_file[rel]
        if rel in file_ids:
            return rel
        return ""

    edge_w: dict[tuple[str, str, str], int] = {}
    for e in raw.get("edges") or []:
        kind = str(e.get("kind") or "")
        if kind.upper() == "CONTAINS":
            continue
        src = str(e.get("source") or e.get("source_qualified") or "")
        tgt = str(e.get("target") or e.get("target_qualified") or "")
        f1, f2 = resolve_file(src), resolve_file(tgt)
        if not f1 or not f2 or f1 == f2:
            continue
        ku = kind.upper()
        if "IMPORT" in ku:
            et = "IMPORTS"
        elif "CALL" in ku:
            et = "CALLS"
        elif "INHERIT" in ku:
            et = "INHERITS"
        else:
            et = kind or "RELATES"
        key = (f1, f2, et)
        edge_w[key] = edge_w.get(key, 0) + 1

    # Ensure endpoints exist as nodes
    for f1, f2, _ in edge_w:
        file_ids.add(f1)
        file_ids.add(f2)

    nodes = []
    for rid in sorted(file_ids):
        if not rid or rid.startswith(".code-review-graph"):
            continue
        group = rid.split("/", 1)[0] if "/" in rid else "root"
        weight = 1 + sum(1 for (a, b, _) in edge_w if a == rid or b == rid)
        nodes.append(
            {
                "id": rid,
                "label": Path(rid).name,
                "kind": "File",
                "group": group,
                "weight": min(weight, 50),
            }
        )
    id_set = {n["id"] for n in nodes}
    edges = []
    for (f1, f2, et), w in sorted(edge_w.items()):
        if f1 not in id_set or f2 not in id_set:
            continue
        edges.append({"from": f1, "to": f2, "type": et, "weight": w})

    commit = commit or git_commit(root)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    return {
        "meta": {
            "repo": "ModoOps",
            "indexedAt": now,
            "stats": {
                "files": len(nodes),
                "nodes": len(nodes),
                "edges": len(edges),
                "communities": 0,
                "processes": 0,
            },
            "commit": commit,
            "description": (
                "Grafo de código ModoOps — file-level desde Índice (code-review-graph); "
                "comunidades/flujos vacíos (scope A, sin inventar)."
            ),
        },
        "nodes": nodes,
        "edges": edges,
        "communities": [],
        "processes": [],
    }


def validate_payload(payload: dict) -> None:
    ids = {n["id"] for n in payload.get("nodes") or []}
    for e in payload.get("edges") or []:
        if e["from"] not in ids or e["to"] not in ids:
            raise ValueError(f"edge endpoint missing node: {e}")
    if payload.get("communities") not in ([], None):
        # allow only empty for scope A
        if payload["communities"]:
            raise ValueError("scope A expects empty communities")
    if payload.get("processes"):
        raise ValueError("scope A expects empty processes")


def write_outputs(payload: dict) -> None:
    validate_payload(payload)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    OUT_JSON.write_text(text, encoding="utf-8")
    OUT_TS.write_text(
        "// Generado por tools/grafo/export_grafo_crg.py — no editar a mano\n"
        f"export const grafoData = {text}"
        "export type GrafoNode = (typeof grafoData.nodes)[number];\n"
        "export type GrafoEdge = (typeof grafoData.edges)[number];\n",
        encoding="utf-8",
    )


def main() -> int:
    force = "--force" in sys.argv
    ensure_crg_json(force=force)
    raw = json.loads(CRG_JSON.read_text(encoding="utf-8"))
    payload = build_grafo_payload(raw)
    write_outputs(payload)
    print(
        f"OK nodes={payload['meta']['stats']['nodes']} "
        f"edges={payload['meta']['stats']['edges']} → {OUT_JSON.relative_to(ROOT)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
