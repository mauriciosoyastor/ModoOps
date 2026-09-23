#!/usr/bin/env python3
"""PROTOTYPE (#202/#203): Laya keep-warm HTTP on loopback.

Throwaway. Load checkpoint once.
  POST /v1/recortar     — candidates from GitNexus (#202)
  POST /v1/seleccionar  — one Matt skill from catalog (#203)

  $env:USE_TF='0'
  $env:LAYA_MODEL_PATH="$PWD\\.models\\laya-multilingual"
  .\\.venv-win\\Scripts\\python.exe tools\\laya\\daemon_http.py
"""
from __future__ import annotations

import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

_DIR = Path(__file__).resolve().parent
if str(_DIR) not in sys.path:
    sys.path.insert(0, str(_DIR))

import harness_recortador as H  # noqa: E402

HOST = os.environ.get("LAYA_DAEMON_HOST", "127.0.0.1")
PORT = int(os.environ.get("LAYA_DAEMON_PORT", "8765"))

_agent = None
_loaded_at: float | None = None


def pick_from_candidates(goal: str, query: str, cands: list[dict]) -> dict:
    """Laya + hybrid only — caller already ran GitNexus query."""
    if not cands:
        return {
            "goal": goal,
            "query": query,
            "n_candidates": 0,
            "laya_choice": None,
            "hybrid_reason": "empty",
            "expand": [],
            "wall_ms": 0.0,
            "skipped_all": True,
        }
    state = H.serialize_state(cands, goal, query or "")
    t0 = time.perf_counter()
    chosen, laya_raw = H.laya_pick(_agent, state, cands)
    expand_ids, reason = H.hybrid_expand_ids(cands, chosen, laya_raw)
    wall_ms = (time.perf_counter() - t0) * 1000.0
    expands, reason2 = _expand_with_symbol_fill(cands, expand_ids, reason)
    return {
        "goal": goal,
        "query": query,
        "n_candidates": len(cands),
        "laya_choice": chosen,
        "hybrid_reason": reason2,
        "expand_ids": [e["process_id"] for e in expands],
        "expand": expands,
        "wall_ms": round(wall_ms, 2),
        "state_chars": len(state),
    }


def _expand_with_symbol_fill(
    cands: list[dict], expand_ids: list[str], reason: str
) -> tuple[list[dict], str]:
    """Prefer rows with symbol+file; replace empty peers from ranked (#206)."""
    by_id = {c["id"]: c for c in cands}
    ranked = sorted(cands, key=lambda c: float(c.get("priority") or 0), reverse=True)
    with_sym = [c for c in ranked if c.get("symbols")]
    expands: list[dict] = []
    used: set[str] = set()
    filled = 0

    def row_ok(c: dict) -> dict:
        s0 = c["symbols"][0]
        return {
            "process_id": c["id"],
            "symbol": s0.get("name"),
            "file": s0.get("file") or None,
            "skipped": False,
            "summary": c.get("summary"),
            "priority": c.get("priority"),
        }

    def row_skip(pid: str, c: dict | None) -> dict:
        return {
            "process_id": pid,
            "symbol": None,
            "file": None,
            "skipped": True,
            "summary": (c or {}).get("summary"),
            "priority": (c or {}).get("priority"),
        }

    for pid in expand_ids:
        if len(expands) >= 2:
            break
        c = by_id.get(pid)
        if c and c.get("symbols") and pid not in used:
            expands.append(row_ok(c))
            used.add(pid)
            continue
        alt = next((x for x in with_sym if x["id"] not in used), None)
        if alt:
            expands.append(row_ok(alt))
            used.add(alt["id"])
            filled += 1
        else:
            expands.append(row_skip(pid, c))
            used.add(pid)

    reason2 = reason if not filled else f"{reason}+fill_sym:{filled}"
    return expands, reason2


def select_skill(pedido: str, skills: list[dict], contexto: str = "") -> dict:
    """Pick exactly one skill id. skills: [{id, blurb}, ...]."""
    if not skills:
        return {
            "pedido": pedido,
            "choice": None,
            "skipped": True,
            "wall_ms": 0.0,
            "n_options": 0,
        }
    criteria = {s["id"]: (s.get("blurb") or s["id"])[:200] for s in skills}
    lines = [f"pedido: {pedido}"]
    if contexto:
        lines.append(f"contexto: {contexto[:400]}")
    lines.append("opciones:")
    for s in skills:
        lines.append(f"- {s['id']}: {(s.get('blurb') or '')[:120]}")
    state = "\n".join(lines)
    questions = {
        "skill": {
            "type": "choice",
            "instructions": (
                "Elegí EXACTAMENTE una opción. "
                "Si el contexto menciona repo/ModoOps/carpeta de proyecto, NUNCA elijas grill-me. "
                "Bugs rotos/intermitentes → diagnosing-bugs. "
                "Ticket ready-for-agent / 'implementá el ticket' → implement. "
                "Issues que llegaron de afuera → triage. "
                "Investigar SDK/docs/fuentes → research. "
                "Esfuerzo grande con niebla / mapa de decisiones → wayfinder. "
                "Idea borrosa con repo → grill-with-docs. "
                "Sin repo → grill-me."
            ),
            "criteria": criteria,
        }
    }
    t0 = time.perf_counter()
    result = _agent.predict(state, questions)
    wall_ms = (time.perf_counter() - t0) * 1000.0
    ans = (result.get("answers") or {}).get("skill") or {}
    choice = ans.get("choice")
    return {
        "pedido": pedido,
        "choice": choice,
        "skipped": choice is None or choice not in criteria,
        "wall_ms": round(wall_ms, 2),
        "n_options": len(skills),
        "probabilities": ans.get("probabilities"),
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:  # quieter
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _json(self, code: int, obj: dict) -> None:
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in ("/health", "/v1/health"):
            self._json(
                200,
                {
                    "ok": True,
                    "loaded": _agent is not None,
                    "loaded_at": _loaded_at,
                    "host": HOST,
                    "port": PORT,
                },
            )
            return
        self._json(404, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b"{}"
        try:
            req = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError as e:
            self._json(400, {"error": f"bad_json: {e}"})
            return

        if path in ("/v1/seleccionar", "/seleccionar"):
            pedido = (req.get("pedido") or "").strip()
            skills = req.get("skills")
            if not pedido or not isinstance(skills, list):
                self._json(400, {"error": "need pedido + skills[]"})
                return
            try:
                out = select_skill(pedido, skills, req.get("contexto") or "")
            except Exception as e:  # noqa: BLE001 — prototype
                self._json(500, {"error": str(e)})
                return
            self._json(200, out)
            return

        if path not in ("/v1/recortar", "/recortar"):
            self._json(404, {"error": "not_found"})
            return
        goal = (req.get("goal") or "").strip()
        cands = req.get("candidates")
        if not goal or not isinstance(cands, list):
            self._json(
                400,
                {
                    "error": "need goal + candidates[] (no GitNexus in daemon — #202)",
                },
            )
            return
        query = req.get("query") or ""
        try:
            out = pick_from_candidates(goal, query, cands)
        except Exception as e:  # noqa: BLE001 — prototype
            self._json(500, {"error": str(e)})
            return
        self._json(200, out)


def main() -> int:
    global _agent, _loaded_at
    print(f"PROTOTYPE daemon_http — loading Laya on {HOST}:{PORT}…", flush=True)
    t0 = time.perf_counter()
    _agent = H.load_laya()
    _loaded_at = time.time()
    print(f"Laya ready in {time.perf_counter() - t0:.1f}s (cold once).", flush=True)
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Listening http://{HOST}:{PORT}/v1/recortar  GET /health", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nBye.", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
