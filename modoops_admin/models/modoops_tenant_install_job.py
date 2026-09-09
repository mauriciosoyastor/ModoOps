"""Job de instalación real G7 — encola en master, ejecuta el cron vía odoo-bin.

El wizard ya no escribe `modules_installed` directo: encola un job
(`pendiente`), el cron lo ejecuta (`en_proceso` → `hecho`/`error`) con
`odoo -d <db> -i <técnicos> --stop-after-init` en subproceso, y recién en
`hecho` se escribe `modules_installed` + auditoría. `remove` sigue mock
(fuera de alcance: desinstalar puede perder datos).
"""

import re
import shutil
import subprocess

from odoo import api, fields, models, _
from odoo.exceptions import UserError

from odoo.addons.modoops_admin.logic.modules_instalados import ModulesInstalados
from odoo.addons.modoops_admin.logic.tenant_module_service import apply_modules

DB_RE = re.compile(r"^modoops_[a-z0-9_]+$")
ODOO_BIN_TIMEOUT_S = 20 * 60
OUTPUT_TAIL = 4000


def catalogo_odoo_map():
    """key catálogo → módulos técnicos Odoo (SSOT modoops_catalogo)."""
    try:
        from modoops_catalogo import get_catalogo

        c = get_catalogo()
        return {k: list((c.get(k) or {}).get("odoo") or []) for k in c.allKeys()}
    except Exception:
        return {}


class ModoopsTenantInstallJob(models.Model):
    _name = "modoops.tenant.install.job"
    _description = "Job instalación real en DB tenant (G7)"
    _order = "id desc"

    tenant_id = fields.Many2one("modoops.tenant", required=True, readonly=True, ondelete="cascade")
    module_keys = fields.Char(required=True, readonly=True, help="CSV keys catálogo")
    tech_modules = fields.Char(readonly=True, help="CSV módulos técnicos Odoo resueltos")
    action = fields.Selection([("install", "Instalar")], default="install", required=True, readonly=True)
    state = fields.Selection(
        [("pendiente", "Pendiente"), ("en_proceso", "En proceso"), ("hecho", "Hecho"), ("error", "Error")],
        default="pendiente",
        required=True,
    )
    output = fields.Text(readonly=True)
    notes = fields.Text()

    @api.model
    def run_pending_jobs(self, limit=1):
        """Cron/smoke: ejecuta el job pendiente más viejo. Sin solape."""
        if self.search_count([("state", "=", "en_proceso")]):
            return False
        pending = self.search([("state", "=", "pendiente")], order="id asc", limit=limit)
        for job in pending:
            job._run_job()
        return True

    def _run_job(self):
        self.ensure_one()
        job = self.sudo()
        tenant = job.tenant_id
        db = tenant.db_name or ""
        if not DB_RE.match(db):
            job._fail(f"db_name inválido '{db}' — solo modoops_<slug>.")
            return False
        keys = [k.strip() for k in (job.module_keys or "").split(",") if k.strip()]
        if not keys:
            job._fail("Sin módulos catálogo.")
            return False
        mapa = catalogo_odoo_map()
        if not mapa:
            job._fail("Catálogo no disponible en el servidor (modoops_catalogo).")
            return False
        techs: list[str] = []
        for k in keys:
            if k not in mapa:
                job._fail(f"Módulo '{k}' no existe en catálogo.")
                return False
            for t in mapa[k]:
                if t not in techs:
                    techs.append(t)
        if not techs:
            job._fail(f"Sin módulos técnicos Odoo para {','.join(keys)}.")
            return False
        binary = shutil.which("odoo") or "odoo"
        job.write({"state": "en_proceso", "tech_modules": ",".join(techs), "output": f"$ {binary} -d {db} -i {','.join(techs)} --stop-after-init"})
        try:
            proc = subprocess.run(
                [binary, "-d", db, "-i", ",".join(techs), "--stop-after-init"],
                capture_output=True,
                text=True,
                timeout=ODOO_BIN_TIMEOUT_S,
            )
        except subprocess.TimeoutExpired:
            job._fail(f"Timeout {ODOO_BIN_TIMEOUT_S // 60}min ejecutando odoo-bin en {db}.")
            return False
        except OSError as e:
            job._fail(f"No se pudo ejecutar odoo-bin: {e}.")
            return False
        tail = (proc.stdout or "")[-OUTPUT_TAIL:] + ("\n" + (proc.stderr or "")[-OUTPUT_TAIL:] if proc.stderr else "")
        if proc.returncode != 0:
            job._fail(f"odoo-bin salió {proc.returncode} en {db}.\n{tail}")
            return False
        # Hecho: recién ahora se escribe modules_installed (labels catálogo) + auditoría
        from .modoops_tenant import CATALOGO_DICT

        labels = [CATALOGO_DICT.get(k, k) for k in keys]
        current = ModulesInstalados.from_csv(tenant.modules_installed)
        try:
            updated = apply_modules(current, labels, "install")
        except ValueError as e:
            job._fail(str(e))
            return False
        tenant.write({"modules_installed": updated.to_csv()})
        tenant._log("install", f"{','.join(labels)} real en {db} — job {job.id}")
        tenant.message_post(body=_("Install real %(mod)s en %(db)s — job %(job)s") % {"mod": ",".join(labels), "db": db, "job": job.id})
        job.write({"state": "hecho", "output": ((job.output or "") + f"\nOK rc=0\n{tail}")[-OUTPUT_TAIL:]})
        return True

    def _fail(self, msg):
        self.ensure_one()
        job = self.sudo()
        job.write({"state": "error", "output": ((job.output or "") + f"\nERROR: {msg}")[-OUTPUT_TAIL:]})
        try:
            job.tenant_id._log("install_error", f"job {job.id}: {msg[:400]}")
        except Exception:
            pass
