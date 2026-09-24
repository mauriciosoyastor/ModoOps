#!/usr/bin/env python3
"""Harness / seam: Índice de código fresco (code-review-graph CLI).

Contrato ADR 0010 / ticket 01:
- status reporta grafo usable
- query estructural responde para un target conocido
- tras tocar un archivo fuente, `update` termina en <5s y el grafo sigue queryable

No importa internals Tree-sitter. Requiere `code-review-graph` en PATH.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROBE = ROOT / "web" / "src" / "lib" / "grafo" / "data.ts"
MAX_UPDATE_S = 5.0
# CLI cold-start (~1–2s) no cuenta como stale del índice; medimos update ya warm.
WARMUP = True


def run_crg(args: list[str], timeout: float = 120.0) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["code-review-graph", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
    )


class IndiceCodigoSeamTests(unittest.TestCase):
    def test_status_shows_usable_graph(self) -> None:
        proc = run_crg(["status"])
        self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)
        blob = (proc.stdout or "") + (proc.stderr or "")
        self.assertTrue(
            any(k in blob.lower() for k in ("node", "edge", "file", "graph")),
            f"status sin señales de grafo:\n{blob[:800]}",
        )

    def test_query_file_summary_for_known_source(self) -> None:
        self.assertTrue(PROBE.is_file(), f"missing probe {PROBE}")
        rel = PROBE.relative_to(ROOT).as_posix()
        proc = run_crg(["query", "file_summary", rel])
        self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)
        out = proc.stdout or ""
        self.assertTrue(len(out.strip()) > 0, "file_summary vacío")

    def test_incremental_update_after_touch_under_5s(self) -> None:
        self.assertTrue(PROBE.is_file())
        if WARMUP:
            warm = run_crg(["update", "--brief"], timeout=60.0)
            self.assertEqual(warm.returncode, 0, warm.stderr or warm.stdout)
        original = PROBE.read_text(encoding="utf-8")
        marker = f"\n// crg-frescor-probe {time.time_ns()}\n"
        try:
            PROBE.write_text(original + marker, encoding="utf-8")
            t0 = time.perf_counter()
            proc = run_crg(["update", "--brief"], timeout=60.0)
            elapsed = time.perf_counter() - t0
            self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)
            self.assertLess(
                elapsed,
                MAX_UPDATE_S,
                f"update tardó {elapsed:.2f}s (límite {MAX_UPDATE_S}s)",
            )
            rel = PROBE.relative_to(ROOT).as_posix()
            q = run_crg(["query", "file_summary", rel])
            self.assertEqual(q.returncode, 0, q.stderr or q.stdout)
        finally:
            PROBE.write_text(original, encoding="utf-8")
            run_crg(["update", "--brief"], timeout=60.0)


if __name__ == "__main__":
    raise SystemExit(unittest.main(verbosity=2))
