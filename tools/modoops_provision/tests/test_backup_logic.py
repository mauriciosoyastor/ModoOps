"""Unittest puro: backup/restore/prune provision (sin Postgres)."""
import sys
import unittest
from pathlib import Path

PROVISION_DIR = Path(__file__).resolve().parents[1]
if str(PROVISION_DIR) not in sys.path:
    sys.path.insert(0, str(PROVISION_DIR))

import provision_tenant as pt  # noqa: E402


class BackupTests(unittest.TestCase):
    def test_backup_filename(self):
        out = pt.backup_filename("modoops_demo", "20260101_0300")
        self.assertEqual(out, "/var/backups/modoops/modoops_demo/20260101_0300.dump")

    def test_prune_keeps_newest(self):
        import tempfile

        with tempfile.TemporaryDirectory() as d:
            names = ["20260101_0300.dump", "20260102_0300.dump", "20260103_0300.dump"]
            for n in names:
                (Path(d) / n).write_text("x")
            removed = pt.prune_backups(d, keep=2)
            self.assertEqual(removed, ["20260101_0300.dump"])
            left = sorted(p.name for p in Path(d).iterdir())
            self.assertEqual(left, names[1:])

    def test_prune_ignores_non_dump(self):
        import tempfile

        with tempfile.TemporaryDirectory() as d:
            (Path(d) / "nota.txt").write_text("x")
            (Path(d) / "20260101_0300.dump").write_text("x")
            self.assertEqual(pt.prune_backups(d, keep=5), [])
            self.assertEqual(len(list(Path(d).iterdir())), 2)

    def test_restore_rejects_path_traversal(self):
        with self.assertRaises(SystemExit):
            pt.cmd_restore("modoops_demo", "../evil.dump", dry_run=True)

    def test_restore_rejects_db_fuera_de_prefijo(self):
        with self.assertRaises(SystemExit):
            pt.cmd_restore("postgres", "20260101_0300.dump", dry_run=True)

    def test_restore_dry_run_valido_no_falla(self):
        pt.cmd_restore("modoops_demo", "20260101_0300.dump", dry_run=True)


if __name__ == "__main__":
    unittest.main()
