"""Controller tenant del Agente — valida apiKey y despacha a modoops.agent.run.

Spec 0008 §Auth: api_key por Tenant en ir.config_parameter
`modoops.agent.api_key.<slug>` (hasheada sha256 hex o plano legacy).
Sin key configurada o mismatch → envelope unauthorized (fail-closed).
El BFF mapea el envelope a HTTP; el controller nunca expone traceback.
"""
import hashlib
import hmac
import re

from odoo import http
from odoo.http import request

from ..logic import executor as ex

DB_RE = re.compile(r"^modoops_[a-z0-9_]+$")
HASH_RE = re.compile(r"^[a-f0-9]{64}$", re.IGNORECASE)


def key_matches(provided: str, stored: str) -> bool:
    """Mirror de hmacCompare del BFF (adapters.ts): sha256 hex o plano legacy.

    Las keys nuevas SIEMPRE en sha256 hex; el plano existe solo para migrar
    seeds viejos. Seeding/rotación por Control Plane: pendiente (sin key → 401).
    """
    provided = provided or ""
    stored = (stored or "").strip()
    if not stored:
        return False
    if HASH_RE.match(stored):
        digest = hashlib.sha256(provided.encode("utf-8")).hexdigest()
        return hmac.compare_digest(digest, stored.lower())
    return hmac.compare_digest(provided, stored)


class AgentExecuteController(http.Controller):
    @http.route("/modoops/agent/execute", type="json", auth="none", methods=["POST"], csrf=False)
    def execute(self, db=None, api_key=None, tool=None, input=None, request_id=None):
        tool = tool or ""
        request_id = request_id or ""
        if not db or not DB_RE.match(db) or db != request.env.cr.dbname:
            return ex.error_envelope(db or "", tool, request_id, "invalid_db", "db_name inválido")
        slug = db[len("modoops_"):]
        stored = request.env["ir.config_parameter"].sudo().get_param(f"modoops.agent.api_key.{slug}", "") or ""
        if not key_matches(api_key or "", stored):
            return ex.error_envelope(db, tool, request_id, "unauthorized", "apiKey inválida")
        try:
            return request.env["modoops.agent.run"].sudo().execute(tool, input or {}, request_id)
        except Exception as e:
            return ex.error_envelope(db, tool, request_id, "error", str(e)[:500])
