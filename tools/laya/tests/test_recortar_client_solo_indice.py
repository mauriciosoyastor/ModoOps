"""Seam: recortar_client solo-índice (sin path A git)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest import mock

_DIR = Path(__file__).resolve().parents[1]
if str(_DIR) not in sys.path:
    sys.path.insert(0, str(_DIR))

import recortar_client as C  # noqa: E402


class ClientSoloIndiceTests(unittest.TestCase):
    def test_doc_declares_solo_indice(self) -> None:
        self.assertIn("solo Índice", C.__doc__ or "")
        self.assertNotIn("Path A (working tree)", C.__doc__ or "")

    def test_main_uses_collect_indice_not_git(self) -> None:
        with (
            mock.patch.object(C.ED, "ensure", return_value=0),
            mock.patch.object(C.RI, "collect_indice", return_value=[]) as col,
            mock.patch.object(C.RG, "collect_status_diff") as git,
            mock.patch.object(
                sys,
                "argv",
                [
                    "recortar_client.py",
                    "-g",
                    "dónde",
                    "-q",
                    "ensure",
                    "--json",
                    "--no-ensure",
                ],
            ),
        ):
            code = C.main()
            self.assertEqual(code, 3)  # abort no hits
            col.assert_called_once()
            git.assert_not_called()


if __name__ == "__main__":
    unittest.main()
