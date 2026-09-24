"""Seam: Path B — Índice (CRG search JSON) → candidatos Laya ≤ top-N."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_DIR = Path(__file__).resolve().parents[1]
if str(_DIR) not in sys.path:
    sys.path.insert(0, str(_DIR))

import recortar_git as G  # noqa: E402
import recortar_indice as I  # noqa: E402


class FakeAgent:
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


FIXTURE = {
    "status": "ok",
    "query": "recortar",
    "results": [
        {
            "name": "recortar_git.py",
            "kind": "File",
            "file_path": "C:/Users/mauri/ProyectosOpencode/ModoOps/tools/laya/recortar_git.py",
            "signature": "tools/laya/recortar_git.py",
            "score": 0.9,
        },
        {
            "name": "collect_status_diff",
            "kind": "Function",
            "file_path": "C:/Users/mauri/ProyectosOpencode/ModoOps/tools/laya/recortar_git.py",
            "signature": "def collect_status_diff",
            "score": 0.8,
        },
        {
            "name": "pnpm-lock.yaml",
            "kind": "File",
            "file_path": "C:/Users/mauri/ProyectosOpencode/ModoOps/pnpm-lock.yaml",
            "score": 0.5,
        },
        {
            "name": "recortar_client.py",
            "kind": "File",
            "file_path": "C:/Users/mauri/ProyectosOpencode/ModoOps/tools/laya/recortar_client.py",
            "score": 0.7,
        },
    ],
}


class RecortarIndiceSeamTests(unittest.TestCase):
    def test_to_repo_rel_strips_absolute_prefix(self) -> None:
        root = Path(r"C:/Users/mauri/ProyectosOpencode/ModoOps")
        rel = I.to_repo_rel(
            r"C:\Users\mauri\ProyectosOpencode\ModoOps\tools\laya\recortar_git.py",
            root,
        )
        self.assertEqual(rel, "tools/laya/recortar_git.py")

    def test_candidates_dedupe_paths_and_exclude_noise(self) -> None:
        cands = I.candidates_from_search_payload(FIXTURE, I.ROOT)
        paths = [c["path"] for c in cands]
        self.assertIn("tools/laya/recortar_git.py", paths)
        self.assertIn("tools/laya/recortar_client.py", paths)
        self.assertNotIn("pnpm-lock.yaml", paths)
        # same file from File + Function → one candidate
        self.assertEqual(paths.count("tools/laya/recortar_git.py"), 1)

    def test_laya_pick_expands_gold_path(self) -> None:
        cands = I.candidates_from_search_payload(FIXTURE, I.ROOT)
        agent = FakeAgent(prefer_substr="recortar_git.py")
        out = G.pick_from_git_candidates(agent, "dónde está recortar git", "recortar", cands)
        self.assertFalse(out.get("abort"))
        self.assertTrue(out.get("session_ok"))
        expand_paths = [e["path"] for e in out["expand"]]
        self.assertIn("tools/laya/recortar_git.py", expand_paths)
        self.assertLessEqual(len(expand_paths), 2)


if __name__ == "__main__":
    raise SystemExit(unittest.main(verbosity=2))
