from odoo import api, fields, models, _
from odoo.exceptions import ValidationError

from ..logic.tool_schemas import CATALOG_BY_NAME, validate_tool_input


class ModoopsAgentTool(models.Model):
    _name = "modoops.agent.tool"
    _description = "Herramienta ModoOps IA — definición en master, ejecución en Tenant"
    _order = "name"

    name = fields.Char(required=True, help="Slug de tool, ej: stock.consulta, ot.cobro")
    label = fields.Char(required=True)
    input_schema = fields.Text(required=True, help="JSON schema del input")
    groups_id = fields.Many2one("res.groups", string="Grupo requerido")
    module_required = fields.Char(help="Módulo Odoo requerido para visibilidad")
    kind = fields.Selection([("read", "Lectura"), ("write", "Escritura")], required=True, default="read")
    active = fields.Boolean(default=True)
    catalog_version = fields.Char(default="0.1")

    _sql_constraints = [("name_unique", "unique(name)", "Tool ya existe")]

    @api.constrains("name", "input_schema")
    def _check_schema(self):
        for rec in self:
            if rec.name not in CATALOG_BY_NAME and rec.active:
                # Permitir tools nuevas fuera de catálogo vivo, pero validar slug
                import re

                if not re.match(r"^[a-z0-9]+(?:[._][a-z0-9]+)*$", rec.name or ""):
                    raise ValidationError(_("Nombre de Tool inválido"))
            # validar JSON schema mínimo
            import json

            try:
                schema = json.loads(rec.input_schema or "{}")
            except Exception as e:
                raise ValidationError(_("input_schema JSON inválido: %s") % e)
            if "type" not in schema:
                raise ValidationError(_("input_schema debe declarar 'type'"))

    def validate_input(self, payload: dict) -> tuple[bool, str | None]:
        self.ensure_one()
        return validate_tool_input(self.name, payload or {})
