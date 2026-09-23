"""Seam: Recortador de sesión (git) — comportamiento externo sin GitNexus."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_DIR = Path(__file__).resolve().parents[1]
if str(_DIR) not in sys.path:
    sys.path.insert(0, str(_DIR))

import recortar_git as G  # noqa: E402


class FakeAgent:
    """Laya stub: elige la primera criterio o la que matchee el goal en el id."""

    def __init__(self, prefer_substr: str | None = None) -> None:
        self.prefer_substr = prefer_substr

    def predict(self, state: str, questions: dict) -> dict:
        criteria = questions["process"]["criteria"]
        choice = next(iter(criteria))
        if self.prefer_substr:
            for cid in criteria:
                if self.prefer_substr in cid:
                    choice = cid
                    break
        probs = {cid: (0.9 if cid == choice else 0.05) for cid in criteria}
        return {"answers": {"process": {"choice": choice, "probabilities": probs}}}


class RecortarGitSeamTests(unittest.TestCase):
    def test_excludes_noise_paths(self) -> None:
        raw = [
            {"path": "web/src/lib/orquestador/llm.ts", "status": "M", "diff_summary": "x"},
            {"path": "pnpm-lock.yaml", "status": "M", "diff_summary": "lock"},
            {"path": "web/public/prototype/vendor/three/three.module.js", "status": "A", "diff_summary": "v"},
            {"path": ".models/laya-multilingual/model.safetensors", "status": "?", "diff_summary": "bin"},
        ]
        out = G.filter_and_rank(raw)
        paths = [c["path"] for c in out]
        self.assertEqual(paths, ["web/src/lib/orquestador/llm.ts"])

    def test_top20_caps_overflow(self) -> None:
        raw = [
            {
                "path": f"web/src/f{i:02d}.ts",
                "status": "M",
                "diff_summary": f"change {i}",
            }
            for i in range(25)
        ]
        out = G.filter_and_rank(raw)
        self.assertEqual(len(out), 20)

    def test_expand_rows_expose_paths_not_skipped(self) -> None:
        cands = G.filter_and_rank(
            [
                {"path": "web/src/a.ts", "status": "M", "diff_summary": "a"},
                {"path": "web/src/b.ts", "status": "M", "diff_summary": "b"},
            ]
        )
        rows, reason = G.expand_git_rows(cands, [cands[0]["id"], cands[1]["id"]], "prio_tie:0")
        self.assertEqual(reason, "prio_tie:0")
        self.assertEqual(len(rows), 2)
        self.assertFalse(rows[0]["skipped"])
        self.assertEqual(rows[0]["path"], "web/src/a.ts")
        self.assertEqual(rows[0]["file"], "web/src/a.ts")

    def test_serialize_state_includes_status_and_diff(self) -> None:
        cands = G.filter_and_rank(
            [{"path": "tools/laya/x.py", "status": "A", "diff_summary": "added pick"}]
        )
        state = G.serialize_state_git(cands, "dónde está pick", "")
        self.assertIn("goal: dónde está pick", state)
        self.assertIn("tools/laya/x.py", state)
        self.assertIn("A", state)
        self.assertIn("added pick", state)

    def test_pick_empty_aborts(self) -> None:
        out = G.pick_from_git_candidates(FakeAgent(), "goal", "", [])
        self.assertTrue(out.get("skipped_all") or out.get("abort"))
        self.assertEqual(out.get("expand"), [])

    def test_pick_returns_gold_path_when_preferred(self) -> None:
        raw = [
            {"path": "docs/noise.md", "status": "M", "diff_summary": "docs"},
            {
                "path": "web/src/lib/orquestador/llm.ts",
                "status": "M",
                "diff_summary": "mockLLM fallback",
            },
        ]
        cands = G.filter_and_rank(raw)
        agent = FakeAgent(prefer_substr="llm.ts")
        out = G.pick_from_git_candidates(
            agent, "Dónde el agente usa mockLLM", "mockLLM", cands
        )
        paths = [e["path"] for e in out["expand"] if not e.get("skipped")]
        self.assertIn("web/src/lib/orquestador/llm.ts", paths)
        self.assertTrue(out.get("session_ok"))


if __name__ == "__main__":
    unittest.main()
