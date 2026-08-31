# Spec — Catálogo ModoOps Single-Source (SSOT) — Deep Module `modoops_catalogo`

> ADR base: `0005-modoops-marca-blanca-catalogo-composable` + `0006-multitenant-centralizado-faseado` + `0007-control-plane-master` + `0008-modoops-ia-agente-herramental-bff`. Glosario canónico: `CONTEXT.md` — Catálogo ModoOps, Lista cerrada de módulos, Configurador ModoOps, Control Plane, Módulo ModoOps, Pricing. Nuevo ADR: `00xx-catalogo-ssot` (generado vs runtime).

## Problem Statement

El Configurador ModoOps, el Control Plane (`modoops_admin` en `modoops_master`) y el BFF Astro prometen un **Catálogo ModoOps** único — el universo ofrecible que mapea cada **Módulo ModoOps** (Mostrador, Depósito Inteligente, Compras, Fiscal AR, etc.) a sus apps Odoo y reglas comerciales (hard gate fiscal, soft gate SKU >500, techo 92h). Hoy ese catálogo vive en 4 fotocopias sin seam: el JSON en `tools/configurador`, la Selection hardcodeada en el modelo Tenant, las keys validadas en el BFF y la tabla en markdown. Añadir un módulo exige 4 edits manuales, el script de sincronización solo advierte, y el cálculo de horas está duplicado entre código y pricing. El resultado es divergencia silenciosa — el BFF puede validar un key que Odoo no conoce, o el techo de horas puede decir 92h mientras el pricing dice otra cosa — y ningún test falla porque cada copia es shallow.

## Solution

Un único **deep module** `modoops_catalogo` cuyo `catalogo.json` es la verdad. Toda la `implementation` (horas por módulo, pricing $52/$155/$800/$45, mapping Odoo, reglas de validación) vive detrás de una `interface` pequeña de 6 métodos. El module genera 3 artefactos commiteados (Selection Odoo + tipos TS + tabla markdown) y un comando de verificación bloquea PRs con drift. Los consumidores (Control Plane, BFF, Configurador, docs) dejan de redefinir el universo y pasan a depender de la misma `interface`. La gobernanza es fail-closed en CI con safety net en runtime.

## User Stories

1. Como Arquitecto ModoOps, quiero que el Catálogo ModoOps sea un único JSON versionado, para que "todo lo que ofrece Odoo = todo lo que está en el Catálogo" sea verificable.
2. Como Consultor ModoOps, quiero añadir un Módulo ModoOps nuevo editando un solo archivo, para que no tenga que tocar Selección Odoo, validación BFF y docs por separado.
3. Como Control Plane en `modoops_master`, quiero que la Selección de `modoops.tenant` provenga del Catálogo generado, para que el Tenant solo pueda instalar módulos del universo validado.
4. Como Configurador ModoOps (interno), quiero validar `modulos_tildados` contra el Catálogo y recibir hard gate "módulo no existe" sin leer filesystem, para que la validación sea offline y testeable.
5. Como Configurador, quiero que incluir `Fiscal AR` sin `anexo_fiscal_ref` devuelva hard gate "Falta anexo_fiscal_ref", para no prometer fiscal sin asesor.
6. Como Configurador, quiero que `sku_count >500` genere warning soft gate "tramo extra días×52", para cotizar Migración Excel correctamente.
7. Como Consultor, quiero que `horasFor([Mostrador, Depósito])` sume horas definidas por módulo y advierta si supera `techo_horas 92h` o `techo_horas + techo_ajustes 8h`, para respetar el Techo de horas del proyecto.
8. Como Dueño de pricing, quiero que `pricing()` retorne ancla $800, anticipo $400, validez 20d, crédito $77.5 y tarifa hora adicional $10.5 desde una sola fuente, para que la Propuesta comercial no invente montos.
9. Como BFF Astro, quiero importar `CatalogoKey` como union type TS (`"mostrador" | "deposito" | ...`) generado, para que `installTenantModules` falle en build si valido un key inexistente.
10. Como BFF, quiero que la validación de `modules` use `catalogo.validate()` en lugar de una lista hardcodeada recortada, para no divergir de Odoo (ej no olvidar `ventas/plataforma/puente_factura`).
11. Como Control Plane, quiero que `modules_installed` siga siendo la Lista cerrada de módulos instalada por Tenant, pero validada contra el Catálogo, para que el Control Plane sea espejo del pricing.
12. Como Documentación, quiero que la tabla de `catalogo-modoops-inicial.md` y la de `CONTEXT.md` se generen desde el JSON, para no mantener 3 tablas a mano.
13. Como CI, quiero que `sync_catalogo --check` falle con exit 1 si algún artefacto generado está desactualizado, para bloquear PRs con drift.
14. Como Runtime (safety net), quiero que Odoo/BFF adviertan si la Selección cargada no coincide con `allKeys()` del JSON, para detectar despliegues a medias.
15. Como Desarrollador, quiero que `configurador.generar()` inyecte el catálogo en lugar de hacer `_load_catalogo()` con FS hardcodeado, para testear sin filesystem real.
16. Como Desarrollador, quiero que la lógica pura del catálogo viva sin ORM ni `sys.path`, siguiendo el patrón `modoops_ia/logic` + wrapper, para que la interface sea la test surface.
17. Como Tester, quiero testear `validate`, `horasFor` y `pricing` offline con un catálogo fake, para no levantar Odoo ni FS.
18. Como Consultor, quiero que el mapeo técnico `anexo_tecnico { odoo, version, repo }` se genere desde `modules[].odoo/version/repo`, para que el anexo técnico no se escriba a mano.
19. Como Cliente, quiero que la Lista cerrada comercial (nombres ModoOps) y el anexo técnico (mapeo Odoo) provengan de la misma fuente, para que no haya contradicción entre propuesta y contrato.

## Implementation Decisions

- **Deep module `modoops_catalogo`**: Nuevo paquete en raíz con `catalogo.json` SSOT y `interface` pública de 6 métodos: `get(key)`, `allKeys()`, `validate(keys, anexo_fiscal_ref?)`, `toSelection()`, `pricing()`, `horasFor(keys)`. La `interface` es pequeña, toda la validación (hard gate módulo inexistente, hard gate fiscal sin anexo, soft gate sku>500, techo 92h) vive detrás. `toTsUnion`/`toMarkdown` son `internal seams` del codegen, no parte de la `interface` pública. La `interface` es la `seam` ideal única — un solo seam para 4 consumidores.
- **SSOT consolidado**: `catalogo.json` contiene `modules[].{modoops, odoo[], depends, version, repo, horas, ancla_retail, addon, grupo, nota}` y `pricing.{tarifa_diaria, descubrimiento, ancla{amount, anticipo, hito1, hito2, techo_horas, techo_ajustes, validez_dias}, abono, tarifa_hora_adicional, addons}` y `capacity`. `horas` es propiedad del Módulo ModoOps, no del pricing; `techo_horas`/`techo_ajustes` son reglas de pricing centralizadas. El dict `HORAS` hardcodeado desaparece (shim temporal en PR1, borrado en PR2).
- **Codegen con 3 artefactos commiteados**: Comando `sync_catalogo --generate` regenera y `sync_catalogo --check` verifica freshness (fail-closed). Artefactos: selección Odoo para `modoops.tenant`, tipos TS para BFF (`CatalogoKey` union + `CATALOGO_KEYS`), y tabla markdown para docs. Ningún consumer lee `catalogo.json` directo como seam primario; el runtime safety net solo warn si hay mismatch.
- **Consumidores como adapters delgados**: Control Plane (`modoops.tenant`) importa `toSelection()`; BFF importa `CatalogoKey` + `validate()`; `configurador.generar()` recibe `catalogo` inyectado (elimina `_load_catalogo()` con `Path.read_text` hardcodeado); docs se regeneran. Cada adapter satisface la misma `interface` en el mismo `seam`.
- **Gobernanza en dos capas**: CI fail-closed como capa primaria (bloquea PR), safety net en Odoo startup / BFF build como segunda red (warn). Un solo comando `resolveTtl`-like para env: no aplica — aquí un solo parser de catálogo, no 4.
- **Migración en 2 PRs (locality de riesgo)**: PR1 crea `modoops_catalogo/` + 3 generados + adapters importan generados + shim `HORAS = {k: modules[k].horas}` + CI warn→fail. PR2 borra shim, borra `CATALOGO_MODOOPS` hardcode, borra `CATALOGO_DICT`, borra `CATALOGO_KEYS` legacy en BFF y `sys.path` hack en configurador wizard, y deja fail-closed estricto.
- **Glosario y ADR**: Actualizar `CONTEXT.md` para dejar explícito que Catálogo ModoOps = `modoops_catalogo/catalogo.json` SSOT que genera Selection/TS/docs, y que Lista cerrada = output de `validate()` (no confundir). Registrar ADR `00xx-catalogo-ssot` con decisión generado vs runtime y por qué generado gana (tipos TS reales, CI drift, no dependencia FS en Odoo).
- **No tocar Infra Multi-DB ni Grafo 384d**: El catálogo es universo ofrecible, no cambia la regla `Tenant = modoops_<slug>` ni el requisito `graph+fts+vector 384d` en `.gitnexus`.

## Testing Decisions

- **Qué hace un buen test aquí**: Probar comportamiento externo a través de la `interface` (`validate`, `horasFor`, `pricing`, `toSelection`, `allKeys`), no detalles de generación de archivos. Un test construye un catálogo fake en memoria, llama a la `interface` y aserta errores hard gate / warnings soft gate / suma de horas / pricing — sin filesystem, sin Odoo, sin BFF.
- **Seams elegidos (de más alto a más bajo, uno ideal)**:
  - **Seam 1 — `modoops_catalogo` interface (más alto, preferido, ideal único)**: 6 métodos. Cubre validación, pricing y horas para todos los consumidores. Tests offline puros contra este seam cubren >90% del comportamiento. Es la test surface.
  - **Seam 2 — `configurador.generar` con catálogo inyectado**: Adapter thin que delega a la `interface`. Testea que hard/soft gates se propagan a `lista_cerrada`/`warnings` sin leer FS.
  - **Seam 3 — Wrapper Odoo / BFF que consume generados**: Test de integración que verifica que `Selection` y `CatalogoKey` coinciden con `allKeys()` y que `sync_catalogo --check` falla si generados están viejos.
  - Propuesta: **un seam activo (interface)** para la mayoría; wrapper solo para drift check. Evitar un seam por módulo del catálogo.
- **Prior art**: `modoops_ia/logic/orchestrator.py` con `decide(validate_api_key, is_suspended, ...)` inyectado y `mo_price_list_import_logic.py` con `parse_tabular_bytes` puro sin ORM — ambos testeables offline con fakes. Reusar ese patrón: inyectar `catalogo` fake, no `CATALOGO_PATH.read_text`.
- **Cobertura mínima (replace-don't-layer)**: `validate(["mostrador","fiscal_ar"], anexo=None) → hard gate fiscal`, `validate(["inexistente"]) → hard gate módulo no existe`, `horasFor(["mostrador","deposito"]) == 45` y `>92 → warning techo`, `pricing().ancla.amount == 800`, `toSelection()` contiene todos los `allKeys()`, `allKeys()` incluye `ventas/plataforma/puente_factura` (hoy faltante en BFF), y `sync_catalogo --check` falla si artefactos desactualizados. Borrar tests viejos que leen `catalogo.json` vía FS o hardcodean `CATALOGO_MODOOPS`; la `interface` es la nueva test surface.

## Out of Scope

- Cambiar el modelo `modules_installed: Text CSV` a `One2many` relacional — se mantiene `Text` + value object; relacional solo si hay queries por módulo (C4).
- Unificar `modoops_ia` Tool Catalog (`tool_schemas.py` + `modoops_agent_tool_data.xml` + `run.ts CATALOG`) — es C2, no este spec.
- Extraer `MetricMixin` en `modoops_core` (`mo_hub_card`/`mo_app_tile`) — bonus speculative, no este spec.
- Re-trabajar `session-store` / `middleware` BFF (C3) o lifecycle Tenant con Clock (C4).
- Grafo GitNexus `--pdg` / PDG layer — fuera de MVP (`CONTEXT.md` fog).
- Grafo por Tenant para embeddings — plantilla futura, no Fase 1.
- Pricing dinámico o multi-moneda más allá de `ars_tipo_cambio` existente.

## Further Notes

- **Seams check**: `interface` de 6 métodos es el único `seam` público; `toTsUnion`/`toMarkdown`/`_generated_*` son `internal seams`. Confirmado en grilling Q4/Q5 (B+C ubicación, A SSOT, A+B gobernanza, 6 métodos, 3 artefactos, horas por módulo).
- **Tracker**: Este spec se publica como `docs/specs/0009-modoops-catalogo-ssot-spec.md` y `.scratch` local hasta completar `docs/agents/issue-tracker.md` vía `/setup-matt-pocock-skills`. Etiqueta conceptual `ready-for-agent`.
- **Próximo paso**: `/to-tickets` desde este spec (tickets: 1) crear `modoops_catalogo` + SSOT + 3 generados + `sync_catalogo --check` CI, 2) migrar consumers (Control Plane/BFF/configurador/docs) a generados, 3) borrar legacy + `CONTEXT.md` + ADR + shim `HORAS`).
