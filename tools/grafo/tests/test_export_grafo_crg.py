"""Seam: CRG visualize JSON → GrafoData scope A (file-level)."""
from __future__ import annotations

import json
import os
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

_DIR = Path(__file__).resolve().parents[1]
if str(_DIR) not in sys.path:
    sys.path.insert(0, str(_DIR))

import export_grafo_crg as E  # noqa: E402


def _sample_raw() -> dict:
    return {
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


class ExportGrafoCrgTests(unittest.TestCase):
    def test_build_file_level_skips_contains_and_empties_communities(self) -> None:
        root = Path("C:/repo/ModoOps")
        out = E.build_grafo_payload(
            _sample_raw(),
            root=root,
            commit="abc1234",
            indexed_at="2026-01-01T00:00:00.000Z",
            exported_at="2026-01-02T00:00:00.000Z",
        )
        ids = {n["id"] for n in out["nodes"]}
        self.assertEqual(ids, {"web/src/a.ts", "web/src/b.ts"})
        self.assertEqual(out["communities"], [])
        self.assertEqual(out["processes"], [])
        self.assertEqual(out["meta"]["stats"]["communities"], 0)
        self.assertEqual(out["meta"]["indexedAt"], "2026-01-01T00:00:00.000Z")
        self.assertEqual(out["meta"]["exportedAt"], "2026-01-02T00:00:00.000Z")
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

    def test_require_nonempty_nodes_aborts(self) -> None:
        empty = {
            "nodes": [],
            "edges": [],
            "communities": [],
            "processes": [],
            "meta": {"stats": {"nodes": 0}},
        }
        with self.assertRaises(ValueError) as ctx:
            E.require_nonempty_nodes(empty)
        self.assertIn("Índice vacío", str(ctx.exception))

    def test_write_outputs_aborts_on_empty_nodes(self) -> None:
        empty = {
            "nodes": [],
            "edges": [],
            "communities": [],
            "processes": [],
            "meta": {"stats": {"nodes": 0}},
        }
        with self.assertRaises(ValueError):
            E.write_outputs(empty)

    def test_ensure_crg_json_raises_when_visualize_fails(self) -> None:
        fake = mock.Mock(returncode=1, stderr="boom", stdout="")
        with mock.patch.object(E, "CRG_JSON", Path("/tmp/missing-crg-graph.json")):
            with mock.patch("export_grafo_crg.subprocess.run", return_value=fake):
                with self.assertRaises(RuntimeError) as ctx:
                    E.ensure_crg_json(force=True)
        self.assertIn("visualize failed", str(ctx.exception))

    def test_iso_mtime_utc_from_file(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "graph.json"
            p.write_text("{}", encoding="utf-8")
            stamp = E.iso_mtime_utc(p)
        self.assertTrue(stamp.endswith("Z"))
        self.assertRegex(stamp, r"^\d{4}-\d{2}-\d{2}T")

    def test_main_path_indexed_at_from_mtime_differs_from_exported_at(self) -> None:
        """Same shape as main(): indexed_at=iso_mtime_utc(graph); exported_at defaulted."""
        with tempfile.TemporaryDirectory() as td:
            graph = Path(td) / "graph.json"
            graph.write_text(json.dumps(_sample_raw()), encoding="utf-8")
            old = time.time() - 86_400
            os.utime(graph, (old, old))
            indexed = E.iso_mtime_utc(graph)
            out = E.build_grafo_payload(
                json.loads(graph.read_text(encoding="utf-8")),
                root=Path("C:/repo/ModoOps"),
                commit="abc1234",
                indexed_at=indexed,
            )
        self.assertEqual(out["meta"]["indexedAt"], indexed)
        self.assertIn("exportedAt", out["meta"])
        self.assertNotEqual(out["meta"]["indexedAt"], out["meta"]["exportedAt"])


if __name__ == "__main__":
    unittest.main()
