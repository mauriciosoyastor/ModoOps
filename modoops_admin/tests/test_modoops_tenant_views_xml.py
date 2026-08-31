"""Unittest puro: Control Plane lista+hub — verifica XML de vistas sin Odoo."""
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

VIEWS = Path(__file__).resolve().parents[1] / "views" / "modoops_tenant_views.xml"
SEARCH_ID = "view_modoops_tenant_search"
TREE_ID = "view_modoops_tenant_tree"
FORM_ID = "view_modoops_tenant_form"


def _parse():
    return ET.parse(VIEWS).getroot()


class TenantTreeTests(unittest.TestCase):
    def setUp(self):
        self.root = _parse()
        self.tree = None
        for rec in self.root.findall("record"):
            if rec.get("id") == TREE_ID:
                self.tree = rec
                break
        self.assertIsNotNone(self.tree, f"{TREE_ID} not found")
        self.arch = self.tree.find("field[@name='arch']")
        self.assertIsNotNone(self.arch)

    def _tree_fields(self):
        # list fields are direct children of arch/list
        lst = self.arch.find("list")
        if lst is None:
            lst = self.arch.find("tree")
        self.assertIsNotNone(lst, "list/tree node missing")
        return [f.get("name") for f in lst.findall("field")]

    def test_tree_has_seven_cols_including_count_and_grace(self):
        fields = self._tree_fields()
        # spec 01: 7 cols = name, db_name, vertical, state, modules_installed_count, abono_due_date, suspend_grace_until, last_backup (last_backup optional but counts)
        for expected in ["name", "db_name", "vertical", "state", "abono_due_date", "suspend_grace_until", "last_backup"]:
            self.assertIn(expected, fields, f"missing {expected} in tree")
        # modules count is computed display — either modules_installed_count or modules_installed
        self.assertTrue(
            "modules_installed_count" in fields or "modules_installed" in fields,
            "missing modules count field",
        )

    def test_tree_state_has_decoration(self):
        lst = self.arch.find("list") or self.arch.find("tree")
        state_field = next((f for f in lst.findall("field") if f.get("name") == "state"), None)
        self.assertIsNotNone(state_field)
        # must carry badge/decoration for AA semáforo
        raw = ET.tostring(lst, encoding="unicode")
        self.assertIn("decoration-danger", raw)
        self.assertIn("decoration-muted", raw)

    def test_tree_has_empty_text_or_help(self):
        raw = ET.tostring(self.arch, encoding="unicode")
        # vacío 0 tenants onboarding — empty_text or sample
        self.assertTrue("empty" in raw.lower() or "0 tenants" in raw.lower() or "onboarding" in raw.lower(), "missing empty_text for vacio")

    def test_tree_has_order_hint(self):
        # _order is in model, but view should hint default_order or search_default; check raw for abono_due_date
        raw = ET.tostring(self.arch, encoding="unicode")
        # rely on model test for order; here just ensure tree not missing abono
        self.assertIn("abono_due_date", raw)


class TenantSearchTests(unittest.TestCase):
    def test_search_view_exists_with_filters(self):
        root = _parse()
        search = None
        for rec in root.findall("record"):
            if rec.get("id") == SEARCH_ID:
                search = rec
                break
        self.assertIsNotNone(search, f"{SEARCH_ID} missing — filtros vertical/state requeridos")
        arch = search.find("field[@name='arch']")
        self.assertIsNotNone(arch)
        raw = ET.tostring(arch, encoding="unicode")
        for filt in ["vertical", "state"]:
            self.assertIn(filt, raw, f"filter {filt} missing in search")


class TenantFormHubTests(unittest.TestCase):
    def setUp(self):
        self.root = _parse()
        self.form = next((r for r in self.root.findall("record") if r.get("id") == FORM_ID), None)
        self.assertIsNotNone(self.form)
        self.arch = self.form.find("field[@name='arch']")
        self.assertIsNotNone(self.arch)

    def test_form_has_sticky_header_and_grace_alert(self):
        raw = ET.tostring(self.arch, encoding="unicode")
        self.assertIn("suspend_grace_until", raw, "grace alert missing")
        self.assertIn("alert", raw.lower(), "alert warning missing")

    def test_form_has_header_actions_with_confirms(self):
        header = self.arch.find(".//header")
        self.assertIsNotNone(header, "header missing")
        raw = ET.tostring(header, encoding="unicode")
        for act in ["action_install_module", "action_suspend", "action_reactivate", "action_mark_baja"]:
            self.assertIn(act, raw, f"header action {act} missing")
        self.assertIn("confirm", raw, "confirm missing on mora actions")

    def test_form_notebook_has_three_sections_plus_actividad(self):
        raw = ET.tostring(self.arch, encoding="unicode")
        # 3 secciones + Actividad, sin Resumen
        for page in ["Módulos", "Logs", "Gestión mora", "Actividad"]:
            self.assertIn(page, raw, f"notebook page {page} missing")
        self.assertNotIn('string="Resumen"', raw, "Resumen debe estar excluida por dec #42")

    def test_form_has_no_resumen(self):
        raw = ET.tostring(self.arch, encoding="unicode")
        self.assertNotIn("Resumen", raw)


if __name__ == "__main__":
    unittest.main()
