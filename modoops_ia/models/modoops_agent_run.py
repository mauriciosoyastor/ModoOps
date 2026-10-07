from odoo import api, fields, models, _
from odoo.exceptions import UserError

from ..logic import executor as ex
from ..logic import ot_cobro as oc
from ..logic import stock_consulta as sc


class ModoopsAgentRun(models.Model):
    _name = "modoops.agent.run"
    _description = "Ejecución (Corrida) del Agente — auditada, idempotente"
    _order = "create_date desc"

    request_id = fields.Char(required=True, index=True, help="UUID cliente para idempotencia")
    tenant_db = fields.Char(required=True, index=True, help="Contexto Tenant db_name")
    tenant_id = fields.Many2one("modoops.tenant", string="Tenant")
    tool_name = fields.Char(required=True, index=True)
    input_json = fields.Text()
    status = fields.Selection(
        [("ok", "OK"), ("needs_tool", "Falla cerrada"), ("needs_human", "Derivado"), ("error", "Error")],
        required=True,
        default="ok",
    )
    output_json = fields.Text()
    _sql_constraints = [
        ("request_tool_tenant_unique", "unique(request_id, tool_name, tenant_db)", "Corrida idempotente ya existe")
    ]

    @api.model
    def create_idempotent(self, vals: dict):
        existing = self.search(
            [("request_id", "=", vals.get("request_id")), ("tool_name", "=", vals.get("tool_name")), ("tenant_db", "=", vals.get("tenant_db"))],
            limit=1,
        )
        if existing:
            return existing
        return self.create(vals)

    def _serialize_row(self, row) -> dict:
        return {
            "status": row.status,
            "output": ex.deserialize_payload(row.output_json),
            "runId": ex.run_id(row.tenant_db, row.tool_name, row.request_id),
            "replayed": True,
        }

    @api.model
    def execute(self, tool_name: str, input_payload: dict | None = None, request_id: str | None = None) -> dict:
        """Ejecuta una Herramienta en el Tenant con idempotencia por request_id.

        Llamado por el controller tenant (`/modoops/agent/execute`), que ya
        validó apiKey. Nunca improvisar writes: tool desconocida → needs_tool.
        request_id vacío se rechaza: sin él no hay idempotencia (el BFF exige UUIDv4).
        """
        dbname = self.env.cr.dbname
        payload = input_payload or {}
        tool_name = tool_name or ""
        if not request_id:
            return ex.error_envelope(dbname, tool_name, "", "invalid_request", "request_id requerido")

        existing = self.search(
            [("request_id", "=", request_id), ("tool_name", "=", tool_name), ("tenant_db", "=", dbname)],
            limit=1,
        )
        if existing:
            return self._serialize_row(existing)

        status, output, code, err = self._dispatch(tool_name, payload)
        vals = {
            "request_id": request_id,
            "tenant_db": dbname,
            # tenant_id vive en master (join por db_name en reportes); en Tenant queda False.
            "tenant_id": False,
            "tool_name": tool_name,
            "input_json": ex.serialize_payload(payload),
            "status": status,
            "output_json": ex.serialize_payload(output),
        }
        try:
            with self.env.cr.savepoint():
                row = self.create(vals)
        except Exception as e:
            # Solo la carrera (unique 23505) se resuelve como replay; lo demás propaga.
            if getattr(e, "pgcode", None) != "23505":
                raise
            existing = self.search(
                [("request_id", "=", request_id), ("tool_name", "=", tool_name), ("tenant_db", "=", dbname)],
                limit=1,
            )
            if existing:
                return self._serialize_row(existing)
            raise
        if status == "ok":
            return ex.ok_envelope(dbname, tool_name, request_id, output)
        return ex.error_envelope(dbname, tool_name, request_id, code or status, err or "", status=status)

    def _dispatch(self, tool_name: str, payload: dict) -> tuple[str, dict, str | None, str | None]:
        """Devuelve (status, output, code, error). Sin ORM aquí salvo lecturas delegadas."""
        if not ex.is_supported(tool_name):
            return ("needs_tool", {"reason": "unknown_tool"}, "unknown_tool", f"Tool '{tool_name}' no existe en Catálogo")

        tool_rec = self.env["modoops.agent.tool"].search([("name", "=", tool_name), ("active", "=", True)], limit=1)
        if not tool_rec:
            return ("needs_tool", {"reason": "tool_disabled"}, "unknown_tool", f"Tool '{tool_name}' no habilitada")
        ok, schema_err = tool_rec.validate_input(payload)
        if not ok:
            return ("error", {}, "invalid_input", schema_err or "input inválido")

        try:
            if tool_name == "echo":
                return ("ok", {"echo": payload}, None, None)
            if tool_name == "stock.consulta":
                return self._run_stock(payload)
            if tool_name == "ot.cobro":
                return self._run_cobro(payload)
        except UserError as e:
            return ("error", {}, "action_failed", str(e))
        except Exception as e:
            return ("error", {}, "error", str(e)[:500])
        return ("error", {}, "error", "dispatch imposible")

    def _run_stock(self, payload: dict) -> tuple[str, dict, str | None, str | None]:
        norm, err = sc.normalize_input(payload)
        if err:
            return ("error", {}, "invalid_input", err)
        Quant = self.env["stock.quant"]
        domain = [("product_id", "=", norm["product_id"])]
        if norm.get("location_id"):
            domain.append(("location_id", "=", norm["location_id"]))
        qty = sum(Quant.search(domain).mapped("quantity") or [0.0])
        return ("ok", sc.format_result(norm["product_id"], qty, norm.get("location_id")), None, None)

    def _run_cobro(self, payload: dict) -> tuple[str, dict, str | None, str | None]:
        norm, err = oc.normalize_input(payload)
        if err:
            return ("error", {}, "invalid_input", err)
        WO = self.env.get("mo.work.order")
        if WO is None:
            return ("error", {}, "error", "Módulo de taller no instalado en el Tenant")
        wo = WO.browse(norm["work_order_id"])
        if not wo.exists():
            return ("error", {}, "invalid_input", f"OT {norm['work_order_id']} inexistente")
        wo.action_collect_cash(norm["amount"], norm.get("medium") or "cash", norm.get("note") or False)
        return ("ok", {"work_order_id": norm["work_order_id"], "amount": norm["amount"], "medium": norm["medium"]}, None, None)
