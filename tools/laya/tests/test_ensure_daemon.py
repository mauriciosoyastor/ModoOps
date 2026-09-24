"""Seam: ensure_daemon no double-spawn when port/process busy."""
from __future__ import annotations

import unittest
from unittest import mock

import ensure_daemon as E


class EnsureNoDoubleSpawn(unittest.TestCase):
    def test_should_spawn_false_when_warm(self) -> None:
        with mock.patch.object(E, "is_warm", return_value=True):
            self.assertFalse(E.should_spawn())

    def test_should_spawn_false_when_port_in_use(self) -> None:
        with (
            mock.patch.object(E, "is_warm", return_value=False),
            mock.patch.object(E, "port_in_use", return_value=True),
            mock.patch.object(E, "daemon_http_pids", return_value=[]),
        ):
            self.assertFalse(E.should_spawn())

    def test_should_spawn_false_when_pid_exists(self) -> None:
        with (
            mock.patch.object(E, "is_warm", return_value=False),
            mock.patch.object(E, "port_in_use", return_value=False),
            mock.patch.object(E, "daemon_http_pids", return_value=[42]),
        ):
            self.assertFalse(E.should_spawn())

    def test_should_spawn_true_when_cold_and_free(self) -> None:
        with (
            mock.patch.object(E, "is_warm", return_value=False),
            mock.patch.object(E, "port_in_use", return_value=False),
            mock.patch.object(E, "daemon_http_pids", return_value=[]),
        ):
            self.assertTrue(E.should_spawn())

    def test_ensure_busy_waits_does_not_spawn(self) -> None:
        with (
            mock.patch.object(E, "is_warm", return_value=False),
            mock.patch.object(E, "should_spawn", return_value=False),
            mock.patch.object(E, "daemon_http_pids", return_value=[99]),
            mock.patch.object(E, "spawn_daemon") as sp,
            mock.patch.object(E, "wait_until_warm", return_value=True) as wait,
            mock.patch.dict(E.os.environ, {"LAYA_MODEL_PATH": "x"}, clear=False),
        ):
            code = E.ensure(wait=True)
            self.assertEqual(code, 0)
            sp.assert_not_called()
            wait.assert_called_once()


if __name__ == "__main__":
    unittest.main()
