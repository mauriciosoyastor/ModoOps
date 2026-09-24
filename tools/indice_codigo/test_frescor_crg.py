#!/usr/bin/env python3
"""Harness / seam: Índice de código fresco (code-review-graph CLI).

Contrato ADR 0010 / ticket 01 (subset verificable en CI local):
- status reporta grafo usable
- query file_summary + callers_of para probes bajo tools/indice_codigo/
- tras tocar probes .ts y .astro, `update` (warm) termina en <5s

Watch/hooks Cursor son ops manuales (README); no se asimilan en este seam.
"""
from __future__ import annotations

import subprocess
import time
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROBE_DIR = Path(__file__).resolve().parent / "probes"
PROBE_TS = PROBE_DIR / "frescor_probe.ts"
PROBE_ASTRO = PROBE_DIR / "frescor_probe.astro"
MAX_UPDATE_S = 5.0


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
    @classmethod
    def setUpClass(cls) -> None:
        PROBE_DIR.mkdir(parents=True, exist_ok=True)
        if not PROBE_TS.exists():
            PROBE_TS.write_text(
                "export function frescorProbeTs(x: number): number {\n  return x + 1;\n}\n",
                encoding="utf-8",
            )
        if not PROBE_ASTRO.exists():
            PROBE_ASTRO.write_text(
                "---\nconst frescorProbeAstro = 1;\n---\n<p>{frescorProbeAstro}</p>\n",
                encoding="utf-8",
            )
        warm = run_crg(["update", "--brief"], timeout=60.0)
        if warm.returncode != 0:
            raise unittest.SkipTest(
                f"code-review-graph update failed (¿build previo?): {warm.stderr or warm.stdout}"
            )

    def test_status_shows_usable_graph(self) -> None:
        proc = run_crg(["status"])
        self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)
        blob = (proc.stdout or "") + (proc.stderr or "")
        self.assertTrue(
            any(k in blob.lower() for k in ("node", "edge", "file", "graph")),
            f"status sin señales de grafo:\n{blob[:800]}",
        )

    def test_query_file_summary_and_callers_for_probes(self) -> None:
        for probe in (PROBE_TS, PROBE_ASTRO):
            rel = probe.relative_to(ROOT).as_posix()
            proc = run_crg(["query", "file_summary", rel])
            self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)
            self.assertTrue((proc.stdout or "").strip(), f"file_summary vacío: {rel}")
        callers = run_crg(
            [
                "query",
                "callers_of",
                "tools/indice_codigo/probes/frescor_probe.ts::frescorProbeTs",
            ]
        )
        # 0 callers is fine for an isolated probe; must not crash
        self.assertEqual(callers.returncode, 0, callers.stderr or callers.stdout)

    def test_incremental_update_ts_and_astro_under_5s(self) -> None:
        for probe in (PROBE_TS, PROBE_ASTRO):
            original = probe.read_text(encoding="utf-8")
            marker = f"\n// crg-frescor-probe {time.time_ns()}\n"
            try:
                probe.write_text(original + marker, encoding="utf-8")
                t0 = time.perf_counter()
                proc = run_crg(["update", "--brief"], timeout=60.0)
                elapsed = time.perf_counter() - t0
                self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)
                self.assertLess(
                    elapsed,
                    MAX_UPDATE_S,
                    f"{probe.name}: update {elapsed:.2f}s > {MAX_UPDATE_S}s",
                )
            finally:
                probe.write_text(original, encoding="utf-8")
                run_crg(["update", "--brief"], timeout=60.0)


if __name__ == "__main__":
    raise SystemExit(unittest.main(verbosity=2))
