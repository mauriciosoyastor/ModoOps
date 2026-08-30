"""TDD seam BFF — Orquestador decide sin DB real."""

import sys
import unittest
from pathlib import Path

LOGIC_DIR = Path(__file__).resolve().parents[1] / "logic"
if str(LOGIC_DIR) not in sys.path:
    sys.path.insert(0, str(LOGIC_DIR))

import orchestrator as orch  # noqa: E402


def ok_key(db, key):
    return key == "secret-123"


def not_suspended(db):
    return (False, None)


def quota_ok(db):
    return False


def quota_exceeded(db):
    return True


def suspended(db):
    return (True, "Suspendido por mora — gracia vencida")


class OrchestratorTests(unittest.TestCase):
    def test_rejects_invalid_api_key(self):
        res = orch.decide(
            db_name="modoops_demo",
            tool_name="echo",
            payload={"message": "hola"},
            request_id="r1",
            api_key="bad",
            validate_api_key=ok_key,
            is_suspended=not_suspended,
            is_quota_exceeded=quota_ok,
        )
        self.assertEqual(res["http"], 401)

    def test_blocks_suspended(self):
        res = orch.decide(
            db_name="modoops_demo",
            tool_name="echo",
            payload={"message": "hola"},
            request_id="r1",
            api_key="secret-123",
            validate_api_key=ok_key,
            is_suspended=suspended,
            is_quota_exceeded=quota_ok,
        )
        self.assertEqual(res["http"], 403)
        self.assertIn("mora", res["error"])

    def test_blocks_quota(self):
        res = orch.decide(
            db_name="modoops_demo",
            tool_name="echo",
            payload={"message": "hola"},
            request_id="r1",
            api_key="secret-123",
            validate_api_key=ok_key,
            is_suspended=not_suspended,
            is_quota_exceeded=quota_exceeded,
        )
        self.assertEqual(res["http"], 429)

    def test_falla_cerrada_unknown_tool(self):
        res = orch.decide(
            db_name="modoops_demo",
            tool_name="no.existe",
            payload={},
            request_id="r1",
            api_key="secret-123",
            validate_api_key=ok_key,
            is_suspended=not_suspended,
            is_quota_exceeded=quota_ok,
            tool_exists=lambda n: False,
        )
        self.assertEqual(res["status"], "needs_tool")
        self.assertEqual(res["http"], 422)

    def test_validates_input_schema(self):
        res = orch.decide(
            db_name="modoops_demo",
            tool_name="echo",
            payload={},
            request_id="r1",
            api_key="secret-123",
            validate_api_key=ok_key,
            is_suspended=not_suspended,
            is_quota_exceeded=quota_ok,
        )
        self.assertEqual(res["http"], 422)

    def test_ok(self):
        res = orch.decide(
            db_name="modoops_demo",
            tool_name="echo",
            payload={"message": "hola"},
            request_id="r1",
            api_key="secret-123",
            validate_api_key=ok_key,
            is_suspended=not_suspended,
            is_quota_exceeded=quota_ok,
        )
        self.assertEqual(res["http"], 200)
        self.assertEqual(res["status"], "ok")


if __name__ == "__main__":
    unittest.main()
