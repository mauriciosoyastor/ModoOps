"""Seam: CRG visualize JSON → GrafoData scope A (file-level)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

_DIR = Path(__file__).resolve().parents[1]
if str(_DIR) not in sys.path:
    sys.path.insert(0, str(_DIR))

import export_grafo_crg as E  # noqa: E402


class ExportGrafoCrgTests(unittest.TestCase):
    def test_build_file_level_skips_contains_and_empties_communities(self) -> None:
        raw = {
            "nodes": [
                {
                    "kind": "File",
                    "name": "C:/repo/ModoOps/web/src/a.ts",
                    "qualified_name": "C:/repo/ModoOps/web/src/a.ts",
                    "file_path": "C:/repo/ModoOps/web/src/a.ts",
                },
                {
                    "kind": "File",
                    "name": "C:/repo/ModoOps/web/src/b.ts",
                    "qualified_name": "C:/repo/ModoOps/web/src/b.ts",
                    "file_path": "C:/repo/ModoOps/web/src/b.ts",
                },
                {
                    "kind": "Function",
                    "name": "foo",
                    "qualified_name": "C:/repo/ModoOps/web/src/a.ts::foo",
                    "file_path": "C:/repo/ModoOps/web/src/a.ts",
                },
                {
                    "kind": "Function",
                    "name": "bar",
                    "qualified_name": "C:/repo/ModoOps/web/src/b.ts::bar",
                    "file_path": "C:/repo/ModoOps/web/src/b.ts",
                },
            ],
            "edges": [
                {
                    "kind": "CONTAINS",
                    "source": "C:/repo/ModoOps/web/src/a.ts",
                    "target": "C:/repo/ModoOps/web/src/a.ts::foo",
                },
                {
                    "kind": "CALLS",
                    "source": "C:/repo/ModoOps/web/src/a.ts::foo",
                    "target": "C:/repo/ModoOps/web/src/b.ts::bar",
                },
                {
                    "kind": "IMPORTS_FROM",
                    "source": "C:/repo/ModoOps/web/src/a.ts",
                    "target": "C:/repo/ModoOps/web/src/b.ts",
                },
            ],
        }
        root = Path("C:/repo/ModoOps")
        out = E.build_grafo_payload(raw, root=root, commit="abc1234")
        ids = {n["id"] for n in out["nodes"]}
        self.assertEqual(ids, {"web/src/a.ts", "web/src/b.ts"})
        self.assertEqual(out["communities"], [])
        self.assertEqual(out["processes"], [])
        self.assertEqual(out["meta"]["stats"]["communities"], 0)
        types = {(e["from"], e["to"], e["type"]) for e in out["edges"]}
        self.assertIn(("web/src/a.ts", "web/src/b.ts", "CALLS"), types)
        self.assertIn(("web/src/a.ts", "web/src/b.ts", "IMPORTS"), types)
        E.validate_payload(out)

    def test_validate_rejects_dangling_edge(self) -> None:
        bad = {
            "nodes": [{"id": "a.ts", "label": "a", "kind": "File", "group": "x", "weight": 1}],
            "edges": [{"from": "a.ts", "to": "missing.ts", "type": "CALLS", "weight": 1}],
            "communities": [],
            "processes": [],
            "meta": {"stats": {}},
        }
        with self.assertRaises(ValueError):
            E.validate_payload(bad)


if __name__ == "__main__":
    unittest.main()
