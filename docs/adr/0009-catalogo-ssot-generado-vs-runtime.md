# ADR 0009 — Catálogo ModoOps single-source con artefactos generados

SSOT: `modoops_catalogo/catalogo.json` con `modules[].{modoops,label,odoo,depends,version,repo,horas}` + `pricing` + `capacity`. Cada `horas` es propiedad del Módulo ModoOps; `techo_horas:92` + `techo_ajustes:8` son reglas de pricing centralizadas. `interface` pública de `modoops_catalogo` es de 6 métodos (`get/allKeys/validate/toSelection/pricing/horasFor`) — tapa chica, mucho adentro; `toTsUnion/toMarkdown/_generated_*` son `internal seams` del codegen, no parte de la tapa.

Generación: `python tools/configurador/sync_catalogo.py --generate` regenera 3 artefactos commiteados: `modoops_catalogo/_generated_selection.py` (Selection Odoo), `web/src/lib/catalogo.generated.ts` (CatalogoKey union + CATALOGO_KEYS/LABELS/HORAS/PRICING), `docs/catalogo-modoops-inicial.md` (tabla). CI `sync_catalogo --check` es fail-closed (exit 1 bloquea PR si drift); safety net runtime solo warn.

Alternativas rechazadas: a) runtime import directo de `catalogo.json` en Odoo/BFF (pierde tipos TS reales, dependencia FS en Odoo, no detecta drift pre-merge), b) split `catalogo.json` vs `pricing.json` (dos verdades, pierde locality de `horasFor` + `techo`), c) mantener `HORAS` dict hardcodeado en `configurador.py` (duplica `pricing.techo_horas`), d) warn-only sin CI (shallow, no concentra verificación), e) `modules_installed` One2many relacional en este ADR (se mantiene `Text` CSV + value object hasta que haya queries por módulo — C4).

Migración en 2 PRs: PR1 expand con shim `HORAS` derivado del SSOT; PR2 contract borra `CATALOGO_MODOOPS` hardcode, `HORAS` fallback, `sys.path` hack y tablas hardcodeadas en docs/`CONTEXT.md`, dejando fail-closed estricto.
