from odoo import api, fields, models, _
from odoo.tools.safe_eval import safe_eval


class SgAppTile(models.Model):
    _name = "mo.app.tile"
    _description = "Tile de acceso a aplicación en launcher modoops"
    _order = "sequence, id"
    _inherit = ["mo.metric.mixin"]
    _metric_cache_key = "_mo_launcher_metrics_cache"

    label = fields.Char(required=True, translate=True)
    hint = fields.Char(translate=True)
    icon = fields.Char(default="fa-th-large")
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)
    target_type = fields.Selection(
        [
            ("hub", "Hub modoops"),
            ("action", "Acción"),
        ],
        required=True,
        default="hub",
    )
    client_tag = fields.Char(
        help="Tag del client action hub (ej. modoops_sales_hub).",
    )
    action_id = fields.Many2one(
        "ir.actions.actions",
        string="Acción",
        ondelete="restrict",
    )
    groups_id = fields.Many2many("res.groups", string="Grupos")
    module_required = fields.Char(
        help="Nombre técnico del módulo requerido para mostrar el tile.",
    )
    enter_label = fields.Char(
        string="Texto de ingreso",
        default="Abrir →",
        translate=True,
    )
    accent_key = fields.Selection(
        [
            ("flame-yellow", "Amarillo llama"),
            ("flame-orange", "Naranja llama"),
            ("flame-deep", "Naranja profundo"),
            ("flame-rust", "Óxido"),
            ("ember-amber", "Ámbar"),
            ("ember-coral", "Coral"),
            ("ember-scarlet", "Escarlata"),
            ("ember-wine", "Vino"),
            ("bg-mid", "Gris medio"),
            ("bg-charcoal", "Carbón"),
            ("bg-deep", "Carbón profundo"),
        ],
        default="flame-orange",
        required=True,
    )
    def _resolve_action_record(self):
        """Resuelve ir.actions.actions al subtipo concreto (act_window, client, …)."""
        self.ensure_one()
        if not self.action_id:
            return self.env["ir.actions.actions"]
        action = self.action_id.sudo()
        if action._name == "ir.actions.actions" and action.type:
            return self.env[action.type].browse(action.id)
        return action

    def _get_action_payload(self):
        self.ensure_one()
        if self.target_type == "hub":
            return {
                "type": "ir.actions.client",
                "tag": self.client_tag,
                "path": self.client_tag,
                "name": self.label,
                "target": "current",
            }
        action = self._resolve_action_record()
        if not action:
            return False
        if action._name == "ir.actions.client":
            payload = {
                "type": "ir.actions.client",
                "tag": action.tag,
                "name": action.name,
                "target": action.target or "current",
                "params": action.params or {},
            }
            if action.path:
                payload["path"] = action.path
            return payload
        if action._name == "ir.actions.act_window":
            ctx = action.context or {}
            if isinstance(ctx, str):
                try:
                    ctx = safe_eval(ctx, dict(self.env.context))
                except Exception:
                    ctx = {}
            else:
                ctx = dict(ctx)
            domain = action.domain
            if isinstance(domain, str):
                domain = self._eval_domain(domain)
            else:
                domain = list(domain or [])
            return {
                "type": "ir.actions.act_window",
                "name": action.name,
                "res_model": action.res_model,
                "view_mode": action.view_mode,
                "domain": domain,
                "context": dict(ctx),
                "target": action.target or "current",
                "views": action.views,
            }
        return False

    def _serialize_tile(self):
        self.ensure_one()
        return {
            "id": self.id,
            "label": self.label,
            "hint": self.hint or "",
            "icon": self.icon or "fa-th-large",
            "enter_label": self.enter_label or _("Abrir →"),
            "target_type": self.target_type,
            "client_tag": self.client_tag or "",
            "accent_key": self.accent_key or "flame-orange",
            "value": self._get_metric_display(),
            "action": self._get_action_payload(),
        }

    def _is_visible_for_user(self):
        self.ensure_one()
        if self.groups_id and not (self.groups_id & self.env.user.group_ids):
            return False
        if self.module_required:
            module = self.env["ir.module.module"].search(
                [
                    ("name", "=", self.module_required),
                    ("state", "=", "installed"),
                ],
                limit=1,
            )
            if not module:
                return False
        if self.target_type == "hub" and not self.client_tag:
            return False
        if self.target_type == "action" and not self.action_id:
            return False
        return True

    @api.model
    def get_launcher_payload(self):
        tiles = self.search([("active", "=", True)], order="sequence, id")
        visible = tiles.filtered(lambda tile: tile._is_visible_for_user())
        metrics_cache = {}
        payload = []
        for tile in visible:
            tile_ctx = tile.with_context(_mo_launcher_metrics_cache=metrics_cache)
            payload.append(tile_ctx._serialize_tile())
        return {"tiles": payload}

    @api.model
    def setup_pos_launcher_entry(self):
        """Apunta el tile POS al kanban de configs (ADR 0004; upgrade seguro)."""
        tile = self.env.ref("modoops_core.launcher_tile_pos", raise_if_not_found=False)
        action = self.env.ref(
            "point_of_sale.action_pos_config_kanban", raise_if_not_found=False
        )
        if tile and action:
            tile.write({"target_type": "action", "action_id": action.id})

    @api.model
    def apply_launcher_tile_copy(self):
        """Force-update launcher labels to work language (noupdate XML)."""
        updates = {
            "modoops_core.launcher_tile_sales": {
                "label": "Ventas",
                "hint": "Pedidos y cotizaciones",
            },
            "modoops_core.launcher_tile_inventory": {
                "label": "Stock",
                "hint": "Productos, stock y operaciones",
            },
            "modoops_core.launcher_tile_accounting": {
                "label": "Cobros",
                "hint": "Facturas, pagos y cobros",
            },
            "modoops_core.launcher_tile_pos": {
                "label": "Mostrador",
                "hint": "Ventas de caja modoops",
            },
        }
        for xmlid, values in updates.items():
            tile = self.env.ref(xmlid, raise_if_not_found=False)
            if not tile:
                continue
            to_write = {
                field: value
                for field, value in values.items()
                if tile[field] != value
            }
            if to_write:
                tile.write(to_write)

    @api.model
    def setup_launcher_tile_accents(self):
        """Asigna accent_key preestablecido por xmlid (upgrade seguro)."""
        mapping = {
            "modoops_core.launcher_tile_sales": "flame-yellow",
            "modoops_core.launcher_tile_customers": "flame-yellow",
            "modoops_core.launcher_tile_inventory": "flame-orange",
            "modoops_core.launcher_tile_purchase": "flame-deep",
            "modoops_core.launcher_tile_accounting": "flame-rust",
            "modoops_core.launcher_tile_workshop": "ember-amber",
            "modoops_core.launcher_tile_pos": "ember-coral",
            "modoops_core.launcher_tile_apps": "ember-scarlet",
            "modoops_core.launcher_tile_settings": "ember-wine",
            "modoops_integrations.launcher_tile_integrations": "ember-amber",
        }
        for xmlid, accent in mapping.items():
            tile = self.env.ref(xmlid, raise_if_not_found=False)
            if tile:
                tile.write({"accent_key": accent})
        tableros = self.search([("label", "=", "Tableros")], limit=1)
        if tableros:
            tableros.write({"accent_key": "bg-charcoal"})
        self.setup_pos_launcher_entry()
        self.apply_launcher_tile_copy()

    @api.model
    def setup_launcher_home_for_users(self):
        """Día D (ADR 0016): home OWL solo para Settings; operativos usan Astro.

        No toca `groups_id` de tiles: Astro BFF sigue leyendo
        `get_launcher_payload` para el shell oficial.
        """
        action = self.env.ref(
            "modoops_core.action_modoops_app_launcher", raise_if_not_found=False
        )
        if not action:
            return
        Users = self.env["res.users"]
        internal = Users.search([("share", "=", False)])
        admins = internal.filtered(lambda u: u.has_group("base.group_system"))
        operatives = internal - admins
        if admins:
            admins.write({"action_id": action.id})
        stuck = operatives.filtered(lambda u: u.action_id == action)
        if stuck:
            stuck.write({"action_id": False})
