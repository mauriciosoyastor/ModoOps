import json
import logging
import time

from odoo import SUPERUSER_ID, http
from odoo.api import Environment
from odoo.http import request, root
from odoo.modules.registry import Registry

_logger = logging.getLogger(__name__)

HANDOFF_PREFIX = "modoops_pos_handoff_"


class ModoopsPosEntrada(http.Controller):
    @http.route("/modoops/pos/entrar", type="http", auth="none", sitemap=False, csrf=False)
    def entrar(self, token=None, db=None, **kwargs):
        if (
            not db
            or not isinstance(db, str)
            or not db.startswith("modoops_")
            or not token
            or not isinstance(token, str)
            or len(token) < 20
        ):
            raise request.not_found()
        key = HANDOFF_PREFIX + token
        raw = ""
        try:
            registry = Registry(db)
        except Exception:
            _logger.exception("No se pudo abrir la base %s para entrar al POS", db)
            raise request.not_found()
        with registry.cursor() as cr:
            # Consumo atómico del token single-use: el lock por fila serializa
            # dos hits paralelos; el segundo lee "" y cae a login (sin TOCTOU).
            # Sin rate-limit dedicado aquí (follow-up): el token es 1 uso + TTL 60s.
            cr.execute("SELECT value FROM ir_config_parameter WHERE key = %s FOR UPDATE", (key,))
            row = cr.fetchone()
            raw = row[0] if row else ""
            if raw:
                env = Environment(cr, SUPERUSER_ID, {})
                env["ir.config_parameter"].set_param(key, "")
            cr.commit()
        if not raw:
            return request.redirect("/web/login?db=%s" % db)
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return request.redirect("/web/login?db=%s" % db)
        if float(data.get("exp") or 0) < time.time():
            return request.redirect("/web/login?db=%s" % db)
        sid = data.get("sid")
        config_id = int(data.get("config_id") or 0)
        if not sid or config_id <= 0:
            return request.redirect("/web/login?db=%s" % db)
        stored = root.session_store.get(sid)
        if not stored or not stored.uid or stored.db != db:
            return request.redirect("/web/login?db=%s" % db)
        stored.is_dirty = True
        request.session = stored
        response = request.redirect(f"/pos/ui/{config_id}?from_backend=1")
        response.set_cookie(
            "session_id",
            sid,
            max_age=90 * 24 * 60 * 60,
            httponly=True,
            samesite="Lax",
            path="/",
        )
        return response
