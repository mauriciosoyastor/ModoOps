"""Wizard thin wrapper Configurador — importa lógica pura."""

import hashlib
import json

try:
    from odoo import api, fields, models  # type: ignore

    HAS_ODOO = True
except Exception:  # pragma: no cover - offline test
    HAS_ODOO = False
    # stubs para import sin Odoo
    class _Stub:
        pass

    api = fields = models = _Stub()  # type: ignore

# lógica pura
try:
    import sys
    from pathlib import Path

    LOGIC_DIR = Path(__file__).resolve().parents[2] / ".." / "tools" / "configurador" / "logic"
    # fallback absolute
    import pathlib

    repo = pathlib.Path(__file__).resolve().parents[2]
    logic_path = repo / "tools" / "configurador" / "logic"
    if str(logic_path) not in sys.path:
        sys.path.insert(0, str(logic_path))
    import configurador as cfg_logic
except Exception:  # pragma: no cover
    cfg_logic = None  # type: ignore


def _hash_input(inp: dict) -> str:
    return hashlib.sha256(json.dumps(inp, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


if HAS_ODOO:

    class ModoopsConfiguradorWizard(models.TransientModel):  # type: ignore
        _name = "modoops.configurador.wizard"
        _description = "Wizard Configurador ModoOps (thin wrapper)"

        vertical = fields.Selection([("retail", "Retail")], default="retail")  # type: ignore
        sucursales = fields.Integer(default=1)  # type: ignore
        almacenes = fields.Integer(default=1)  # type: ignore
        cajas_pos = fields.Integer(default=1)  # type: ignore
        # simplificado: Char con lista separada por comas
        modulos_tildados = fields.Char(default="mostrador,deposito")  # type: ignore
        anexo_fiscal_ref = fields.Char()  # type: ignore
        sku_count = fields.Integer(default=0)  # type: ignore

        def action_generar(self):
            self.ensure_one()
            modulos = [m.strip() for m in (self.modulos_tildados or "").split(",") if m.strip()]
            inp = {
                "vertical": self.vertical,
                "sucursales": self.sucursales,
                "almacenes": self.almacenes,
                "cajas_pos": self.cajas_pos,
                "modulos_tildados": modulos,
                "anexo_fiscal_ref": self.anexo_fiscal_ref or None,
                "sku_count": self.sku_count,
            }
            out = cfg_logic.generar(inp)  # type: ignore
            if out["errors"]:
                return {"errors": out["errors"]}
            # doble persistencia: ir.attachment + log
            hash_val = _hash_input(inp)
            # ir.attachment
            import base64

            md_bytes = out["propuesta"]["comercial_md"].encode("utf-8")
            self.env["ir.attachment"].create(  # type: ignore
                {
                    "name": f"propuesta_{hash_val[:8]}.md",
                    "type": "binary",
                    "datas": base64.b64encode(md_bytes).decode("ascii"),
                    "mimetype": "text/markdown",
                    "res_model": "modoops.tenant",
                }
            )
            # modoops.tenant.log
            self.env["modoops.tenant.log"].create(  # type: ignore
                {
                    "action": "configurador_generar",
                    "hash": hash_val,
                    "input_json": json.dumps(inp, ensure_ascii=False),
                }
            )
            return out

else:

    class ModoopsConfiguradorWizard:  # type: ignore
        """Stub para tests sin Odoo."""

        def __init__(self, inp: dict):
            self.inp = inp

        def generar(self):
            return cfg_logic.generar(self.inp)  # type: ignore
