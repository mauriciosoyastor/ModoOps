"""Unittest puro: job instalación real G7 (estilo texto, sin Odoo)."""
import unittest
from pathlib import Path

JOB_MODEL = Path(__file__).resolve().parents[1] / "models" / "modoops_tenant_install_job.py"
WIZARD_MODEL = Path(__file__).resolve().parents[1] / "models" / "modoops_tenant_install_wizard.py"


class InstallJobModelTests(unittest.TestCase):
    def test_job_resuelve_tecnicos_desde_catalogo(self):
        text = JOB_MODEL.read_text(encoding="utf-8")
        self.assertIn("catalogo_odoo_map", text)
        self.assertIn("modoops_catalogo", text)

    def test_job_solo_db_tenant_y_allowlist(self):
        text = JOB_MODEL.read_text(encoding="utf-8")
        self.assertIn("modoops_[a-z0-9_]", text)
        self.assertIn("tech_modules", text)
        self.assertIn("--stop-after-init", text)

    def test_job_sin_solape_y_timeout(self):
        text = JOB_MODEL.read_text(encoding="utf-8")
        self.assertIn("en_proceso", text)
        self.assertIn("TimeoutExpired", text)

    def test_wizard_encola_job_en_install(self):
        text = WIZARD_MODEL.read_text(encoding="utf-8")
        self.assertIn("modoops.tenant.install.job", text)
        self.assertIn("job_id", text)

    def test_wizard_remove_sigue_mock(self):
        text = WIZARD_MODEL.read_text(encoding="utf-8")
        self.assertIn("Mock remove", text)


if __name__ == "__main__":
    unittest.main()
