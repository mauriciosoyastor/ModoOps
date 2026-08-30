# 01: Prefactor — esqueleto modoops_ia + seam lógica pura

**What to build:** Repo compila con `modoops_ia` vacío en nuevo namespace `modoops.*` sin tocar `mo.*` legacy. Crea `modoops_ia/__manifest__.py`, `logic/` sin ORM y wrappers stubs `modoops.agent` / `modoops.agent.tool` (master) + `modoops.agent.run`/`memory` (tenant). Valida que el seam `modoops_ia/logic` es importable offline y que CI sigue verde.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `modoops_ia` instalable en `modoops_master` y `modoops_<slug>` sin romper `modoops_core`/`modoops_admin`
- [ ] `modoops_ia/logic/*.py` sin `from odoo import` (lógica pura, testeable offline al estilo `mo_price_list_import_logic.py:1`)
- [ ] `modoops.agent.tool` define `input_schema`+`groups_id`+`module_required` visibles en `GET /api` futuro
- [ ] `npm --prefix web run build` y `python -m py_compile` verdes
