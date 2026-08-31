# Research — Patrones Configurador interno operable y generación Lista cerrada + Propuesta

> **Ticket:** #47 · **Mapa:** #46 · **Rama throwaway:** `research/configurador-patrones` · **Fecha:** 2026-08-31 · **Autor:** agente AFK research (Muse Spark)
> **Pregunta:** ¿Qué patrón implementa mejor el Configurador ModoOps interno (checklist Catálogo → Lista cerrada + alcance + precio + hitos) sin prometer todo OCA? Investigar dónde vive (CLI vs wizard Odoo vs web app), cómo generar Lista cerrada + Propuesta 10 secciones con marca blanca, y qué reglas/capacity enforzar.
> **Repo:** `C:\Users\mauri\OneDrive\Desktop\ProyectosOpencode\ModoOps` · **HEAD:** `e9cf429`

---

## 1. Resumen ejecutivo (TL;DR)

| Decisión | Recomendación |
|----------|---------------|
| **Dónde vive (Fase 1)** | **Lógica pura Python en `tools/configurador/` (= fuente de verdad) + thin wrapper wizard Odoo en `modoops_admin`** — CLI operable en día 1, wizard reusa la misma librería. Web interna diferida a Fase 2. |
| **Por qué no solo docs hoy** | `docs/modoops-configurador.md:1` + `docs/catalogo-modoops-inicial.md:1` + `docs/plantillas/descubrimiento-modoops-checklist.md:1` describen **qué** tildar/generar pero no ejecutan. Falta enforzar computable: techo 92h, 8h ajustes, 2 anclas, add-ons. |
| **Lista cerrada** | Generar **dos artefactos** desde el mismo JSON: (a) comercial = solo nombres ModoOps, (b) anexo técnico = mapeo `ModoOps→Odoo` + `versión/rama/repo` + exclusiones + hitos. |
| **Propuesta 10 secciones** | Template Markdown → PDF (patrón ya probado `docs/generar_pdf_ventas_repuestos.py:1` con `FPDF`) con validez 20d, anticipo $400 → $322.5 con crédito, hitos $200+$200. |
| **Reglas a enforzar** | Ancla $800 techo 92h; ajustes 8h; add-ons `SKU $155 / días×$52 / $10.5/h`; capacidad 2 paralelas 15–18h/sem; alerta Fase 2 si supera techo. |
| **Seams testeables** | `logic/` puro sin ORM (unit), `wizard` wrapper Odoo (integration con DB), `web/` contrato solo si se habilita (e2e). |

**No cerrar ticket:** Wayfinder resuelve vía grilling en #49/#50/#51.

---

## 2. Estado verificado — por qué hoy solo docs sin herramienta operable

### 2.1 Fuentes primarias

- `docs/modoops-configurador.md:1` — define Configurador como "Herramienta interna … no self-service" con flujo 3 pasos `Tildar → Generar Lista cerrada → Emitir Propuesta` (`docs/modoops-configurador.md:34`) y plantilla Lista cerrada (`docs/modoops-configurador.md:38`).
- `docs/catalogo-modoops-inicial.md:7` — 8 módulos validados (Mostrador `point_of_sale+pos_discount`, Depósito `stock`, Ventas `sale_management`, Compras `purchase`, Fiscal AR `account+l10n_ar`, Contactos, Plataforma `modoops_core`, Puente Factura Web `modoops_integrations`). Taller y candidatos = Add-on (`docs/catalogo-modoops-inicial.md:17`).
- `docs/plantillas/descubrimiento-modoops-checklist.md:1` — checklist 3 días + tildado Catálogo (`docs/plantillas/descubrimiento-modoops-checklist.md:41`) + entregables Informe 9 + Propuesta 10 + Lista cerrada (`docs/plantillas/descubrimiento-modoops-checklist.md:62`).
- `CONTEXT.md:66` (`Paquete ancla $800 50/25/25`), `CONTEXT.md:69` (Techo 92h), `CONTEXT.md:113` (Techo ajustes 8h), `CONTEXT.md:178` (Capacidad 2 paralelas), `CONTEXT.md:50` (marca blanca), `CONTEXT.md:491` (Propuesta 10 secciones).
- Implementación previa: `tools/modoops_provision/provision_tenant.py:1` (CLI manual Multi-DB) + `modoops_admin/models/modoops_tenant.py:6` (`CATALOGO_MODOOPS`) + `modoops_admin/models/modoops_tenant_install_wizard.py:1` (mock instala módulos, no ejecuta `odoo-bin`). `web/src/data/business.ts:21` solo expone `publicPricing.discovery $155`, ancla/abono quedan "tras diagnóstico" (`CONTEXT.md:37`).

### 2.2 Gap: doc sin enforzar

El checklist es **manual**: tildar casillas no calcula precio ni alerta techo ni bloquea "todo OCA". El Configurador necesita pasar de doc a **función `(vertical + módulos tildados + SKU) → (lista cerrada + precio/hitos + alertas)`** computable — idéntico salto que Fase 1 hizo con `provision_tenant.py` para tenants (CLI + mock wizard).

---

## 3. Patrones evaluados — dónde vive

### 3.1 CLI en `tools/configurador/` (recomendado como fuente de verdad Fase 1)

**Qué sería:** `tools/configurador/configurador.py` + `tools/configurador/logic/` puro (sin Odoo) + `tools/configurador/catalogo.json` espejo de `docs/catalogo-modoops-inicial.md:7` y `modoops_admin/models/modoops_tenant.py:6`.

**Pros:**
- Operable offline, sin Odoo corriendo — como `tools/modoops_provision/provision_tenant.py:42` (crea DB + instala `modoops_core` + cron). Patrón ya validado.
- Testeable 100% unit: lógica pura sin `odoo` import (mismo seam que `mo_price_list_import_logic.py:89` `MAX_IMPORT_ROWS=500` + `modoops_ia/logic/` ADR `CONTEXT.md:300`).
- Versionable, difiable, CI-friendly; genera JSON/Markdown/PDF sin UI.
- Costo casi 0: un script + tests.

**Contras:**
- Sin UI: operador técnico debe correr terminal. No escalable si el configurador lo usa alguien no-dev.
- No integrado visualmente al Control Plane (`modoops_admin`); requiere copiar salida a mano si no hay bridge.

**Cuándo elegirlo:** Fase 1 con 1 operador (vos) y 0–2 anclas. Suficiente para cerrar primer ancla hacia meta `CONTEXT.md:39` $600/mes.

### 3.2 Wizard Odoo en `modoops_admin` (recomendado como thin wrapper, no como único host)

**Qué sería:** `modoops_admin/models/modoops_configurador_wizard.py` (TransientModel) con `vertical`, `modules` (Selection/M2M del catálogo), `sku_count`, `dias_extra`, `fiscal_anexo_ref`; método `action_generar()` que importa `tools/configurador/logic` y escribe `propuesta.md` + `lista_cerrada.md` en `ir.attachment` + log en `modoops.tenant.log` (`modoops_admin/models/modoops_tenant.py:104`).

**Pros:**
- Vive donde viven los tenants (`modoops_master`, `modoops_admin/__manifest__.py:14` `depends: base,web,mail`) — misma seguridad/roles que `action_install_module` (`modoops_admin/models/modoops_tenant.py:115`).
- Reusa chatter, auditoría, permisos; output queda trazado junto al Tenant si ya existe.
- Patrón ya existente: `modoops_tenant_install_wizard.py:7` es mock que hoy solo actualiza `modules_installed` (`modoops_tenant_install_wizard.py:26`) y loguea comando `odoo-bin -d <db> -i <modulo>` (`modoops_tenant_install_wizard.py:28`). Extenderlo a "wizard Configurador" es natural.

**Contras:**
- Requiere Odoo corriendo para generar propuesta — bloquea uso pre-tenant (prospecto aún sin DB).
- Testing exige harness Odoo (`odoo-bin shell`, `HttpCase`); lógica acoplada a ORM si no se separa `logic/`.
- Transient lifecycle (se borra) → artefacto debe persistirse en `ir.attachment` o `tenant.notes`.

**Cuándo elegirlo:** Como **wrapper** sobre la lógica CLI, no como reimplementación. Útil cuando el prospecto ya tiene `modoops.tenant` borrador creado en Control Plane.

### 3.3 Web app interna en `web/` (Astro SSR/BFF) — diferir

**Qué sería:** Ruta privada `web/src/pages/configurador.astro` (auth basic/IP allowlist) + API `web/src/pages/api/configurador/generar.ts` que importa la lógica (vía `web/src/lib/configurador/`).

**Pros:**
- UI amigable (cards Catálogo, preview Lista cerrada/Propuesta, botón "Descargar PDF") — atractivo para operador no-dev.
- Reusa shell Astro BFF ya operativo `web/src/pages/api/modoops/[db]/agent/run.ts:1` + `web/src/pages/api/modoops/[db]/agent/tools.ts:1` con pattern Orquestador/BFF (`CONTEXT.md:268`).

**Contras:**
- Nueva superficie a asegurar (auth, rate-limit, CORS) — el Control Plane ya es el perímetro interno; duplicar perímetro aumenta riesgo.
- Duplica fuente de verdad del catálogo: `web/src/data/business.ts:21` hoy solo publica `$155`; ancla/abono son internos (`CONTEXT.md:37` "tras diagnóstico"). Sincronizar `web/` ↔ `tools/` ↔ `modoops_admin` exige single-source (JSON) o drift.
- Infra extra (deploy, env, CI) para 1–2 usuarios Fase 1 — overkill antes de validar 2–3 anclas (`docs/modoops-configurador.md:58`).

**Cuándo elegirlo:** Fase 2 cuando haya operador comercial no-dev o >2 configuraciones/semana. Hoy es costo sin retorno.

### 3.4 Matriz trade-offs

| Dimensión | CLI `tools/` | Wizard Odoo `modoops_admin` | Web `web/` |
|-----------|--------------|-----------------------------|------------|
| **Tiempo a operable** | Horas (script + JSON) | Días (wizard + vistas XML) | Días–semanas (ruta + auth + PDF) |
| **Sin Odoo** | Sí | No | No (frontend) |
| **Pre-tenant (prospecto)** | Sí | No (requiere tenant) | Sí (si auth OK) |
| **Auditoría** | Log file/JSON | `modoops.tenant.log` + chatter | Logs BFF |
| **Test seam** | Unit puro (mocker none) | Integration Odoo | E2E Playwright |
| **Fuente verdad catálogo** | `catalogo.json` single-source | Importa `CATALOGO_MODOOPS` `modoops_admin/models/modoops_tenant.py:6` | Importa `business.ts:21` |
| **Riesgo marca blanca** | Bajo (template controlado) | Bajo | Medio (exposición si ruta mal asegurada) |
| **Costo Fase 1** | Mínimo | Medio | Alto |

**Recomendación:** **CLI logic como single-source + wizard thin** — el CLI genera artefactos y el wizard los expone en Odoo sin reimplementar. Web queda como `Out of scope` mapa #46 hasta validar funnel (#48→#52).

---

## 4. Generación Lista cerrada + Propuesta 10 secciones

### 4.1 Lista cerrada — dos artefactos desde un JSON

**Input (checklist):** `vertical` (retail/servicios/distribución, `modoops_admin/models/modoops_tenant.py:45`), módulos tildados (subset `CATALOGO_MODOOPS`), anexo fiscal ref (`docs/plantillas/descubrimiento-modoops-checklist.md:25`), SKU count (¿≤500? `docs/catalogo-modoops-inicial.md:28` `MAX_IMPORT_ROWS=500`), recursos/infra.

**Catálogo fuente único:** `docs/catalogo-modoops-inicial.md:7` + `modoops_admin/models/modoops_tenant.py:6` + `docs/modoops-configurador.md:21` deben mapear idéntico — proponer `tools/configurador/catalogo.json`:

```json
{
  "mostrador": {"modoops": "Mostrador", "odoo": ["point_of_sale","pos_discount"], "depends": ["base","product"], "version": "19.0", "repo": "odoo/odoo", "ancla_retail": true},
  "deposito": {"modoops": "Depósito Inteligente", "odoo": ["stock"], "ancla_retail": true},
  "fiscal_ar": {"modoops": "Fiscal AR", "odoo": ["account","l10n_ar"], "ancla_retail": "según anexo", "flag": "modoops.fiscal_enabled"}
}
```

Patrón ya documentado: `CONTEXT.md:538` plantilla Lista cerrada (`nombre técnico + versión/rama + repo`); ejemplo concreto `docs/plantillas/ejemplo-descubrimiento-modoops-retail.md:65` (8 líneas con CE 19); `docs/modoops-configurador.md:38` template análogo.

**Output duales (marca blanca `CONTEXT.md:50` + `CONTEXT.md:413`):**

| Artefacto | Para quién | Menciona Odoo | Ejemplo línea |
|-----------|------------|----------------|---------------|
| **Lista cerrada comercial** | Cliente (contrato) | No — solo `ModoOps: Mostrador — 2 cajas`, `Depósito Inteligente — 1 almacén` | `Mostrador — hasta 2 cajas — 1 sucursal` |
| **Anexo técnico** | Contrato anexo + `odoo-bin -d <db> -i <modulo>` | Sí — mapeo `ModoOps→Odoo` + versión/rama/repo + `Odoo CE 19` | `Mostrador — point_of_sale + pos_discount — CE 19 — odoo/odoo#19.0` |

**Exclusiones explícitas:** `CONTEXT.md:375` (CRM, eCommerce, MRP, multi-sucursal) + `docs/modoops-configurador.md:45` (`Excluidos: CRM, eCommerce, MRP, multi-sucursal`) — generar bloque `Excluidos` dinámico: todo candidato no tildado va a `Add-on/Fase 2`.

### 4.2 Propuesta comercial 10 secciones

`CONTEXT.md:491` + `docs/plantillas/descubrimiento-modoops-checklist.md:63` fijan las 10:

1. Alcance Paquete ancla (módulos vía Configurador) 2. Exclusiones 3. Precio/hitos + techo 92h 4. Criterios Hito 1/2 5. Plazo orientativo 6. Add-ons opcionales 7. Supuestos Cliente (infra/fiscal/datos) 8. Soporte (hipercare→transición→abono $45) 9. Validez 20 días 10. Próximo paso (firma + anticipo).

**Montos:** Ancla `$800 50/25/25 → $400/$200/$200` (`CONTEXT.md:66`, `CONTEXT.md:572`), anticipo `$400` menos crédito `50% de $155 = $77.5` → `$322.5` netos si firma en 20 días (`CONTEXT.md:28`, `docs/plantillas/ejemplo-descubrimiento-modoops-retail.md:82`), abono `$45` (`CONTEXT.md:190`), mig exp `Migración $155 ≤500` (`CONTEXT.md:97`).

**Marca blanca:** `web/src/data/business.ts:21` solo publica `discovery $155`; ancla/abono "tras diagnóstico" (`CONTEXT.md:37`). El template debe tener `{{#if comercial}}` que omite `Odoo CE / l10n_ar / point_of_sale` y deja solo nombres ModoOps; el anexo técnico los incluye.

**PDF:** Reusar patrón `docs/generar_pdf_ventas_repuestos.py:14` (`FPDF`, `add_font`, `table_row`, `quote_block`, `OUTPUT` a `Path`). Para Propuesta, extraer helper `tools/configurador/render.py` con `FPDF` o `reportlab` — FPDF ya está en `docs/generar_pdf_ventas_repuestos.py:5` y es suficiente para 10 secciones sin HTML. Alternativa Odoo `ir.actions.report` queda diferida (requires QWeb).

---

## 5. Reglas operativas a enforzar (computables)

| Regla | Fuente | Enforzar cómo | Alerta |
|-------|--------|----------------|--------|
| **Ancla Retail $800 = Mostrador+Depósito+Ventas+Compras+Fiscal+Plataforma** | `docs/modoops-configurador.md:25`, `CONTEXT.md:66`, `CONTEXT.md:307` | `logic/ancla.py:combo_retail()` valida subset, retorna precio fijo | Si tilda módulo fuera combo sin Add-on → bloquea |
| **Techo 92h (~15.5 días×6h)** | `CONTEXT.md:69`, `CONTEXT.md:572`, `docs/modoops-configurador.md:25` | `logic/horas.py:estimar(mods)` suma horas por módulo (tabla interna, ej. Mostrador 20h, Depósito 12h); si `>92` → `alert: Fase 2` | `docs/modoops-configurador.md:27` "alerta y propone Fase 2, no infla ancla" |
| **Techo ajustes técnicos 8h** | `CONTEXT.md:113`, `CONTEXT.md:310` | Contador separado en JSON; `logic/horas.py` distingue config vs desarrollo | `>8h` → cotiza Add-on `Desarrollo a medida` (`CONTEXT.md:116`) |
| **Add-ons SKU / días×$52 / $10.5/h** | `CONTEXT.md:19` ($52/día 6h), `CONTEXT.md:32` ($10.5/h), `CONTEXT.md:581`, `docs/catalogo-modoops-inicial.md:21` | `logic/precios.py:precio_addon(tipo)` con `SKU $155` (migración ≤500, B2B, Taller), `dias*52` (fiscal fuera estándar, integración mín 2d=$104), `$10.5/h` (micro) | Migración >500 → `ceil((n-500)/~340)*52` (~680→$78 como `docs/plantillas/ejemplo-descubrimiento-modoops-retail.md:33`) |
| **Capacidad 2 anclas paralelas, 15–18h/sem** | `CONTEXT.md:179`, `CONTEXT.md:497`, `docs/modoops-configurador.md:29` | `tools/configurador/capacidad.json` (o query a `modoops.tenant` state=activo); `logic/capacidad.py:can_schedule(nuevos=1)` | Si 3 paralelas → `bloquea y sugiere replanificar` (`docs/modoops-configurador.md:29`) |
| **Validez 20 días** | `CONTEXT.md:141`, `CONTEXT.md:504` | `propuesta.json:validez = emision + 20d`; `logic/credito.py:credito(firma, emision)` | Crédito $77.5 solo si `firma - emision ≤20d` (`CONTEXT.md:28`) |
| **Marca blanca** | `CONTEXT.md:50`, `CONTEXT.md:413`, `docs/modoops-configurador.md:30` | Flag `comercial=True` filtra términos `Odoo/CE/l10n_ar/OCA` | CI grep `Odoo` en artefacto comercial debe fallar |

Plazo orientativo: `92h / (15–18h/sem) ≈ 5–6 sem` + buffers fiscal/datos → `6–8 sem` como `docs/plantillas/ejemplo-descubrimiento-modoops-retail.md:64` (`6–8 semanas 15–18h/sem`).

---

## 6. Seams a testear — lógica pura vs wrapper vs contrato web

Inspirado en `CONTEXT.md:300` namespace `modoops.*` (`logic/` puro + wrapper Odoo) y `docs/adr/0008-modoops-ia-agente-herramental-bff.md` patrón Tool/Aduana.

### 6.1 Lógica pura `tools/configurador/logic/` — unit, sin Odoo, sin red

| Seam | Qué testea | Ejemplo test |
|------|------------|--------------|
| `catalogo.py:load()` | Catálogo = single-source, 8 validados + candidatos Add-on | `assert "mostrador" in catalogo` y `catalogo["mostrador"]["ancla_retail"]==True` |
| `ancla.py:es_ancla_retail(mods)` | Combo base cerrado | `assert es_ancla_retail(["mostrador","deposito","compras","fiscal_ar"])==True` |
| `horas.py:estimar(mods)` | Suma horas vs techo 92h + ajustes 8h | `estimar(ancla_retail) < 92` ; `estimar(ancla+ mig_680) > 92` → alerta |
| `precios.py:calcular(vertical, mods, dias_extra, sku_count)` | $800 + add-ons + crédito | `calcular(ancla, dias_extra=0) == 800` ; `calcular(..., firma_dentro_20d=True)["anticipo"]==322.5` |
| `capacidad.py:can_schedule(activos=2, nuevo=1)` | Bloquea 3ª paralela | `can_schedule(2,1)==False` con `reason:"capacidad 2 anclas"` |
| `render.py:lista_cerrada()` | Dual comercial/anexo | `comercial no contiene "Odoo"` y `anexo contiene "l10n_ar"` |
| `render.py:propuesta()` | 10 secciones + validez | `propuesta["validez_dias"]==20` y 10 keys presentes |

Ejecuta con `pytest tools/configurador/tests/` sin Odoo — crítico para CI rápido (idéntico a `modoops_ia` tests que evitan Odoo boot `fix/modoops_ia`).

### 6.2 Wrapper Odoo `modoops_admin` — integration, con DB

| Seam | Qué testea | Cómo |
|------|------------|------|
| `wizard.create → action_generar` | Wizard invoca `logic/` y escribe `ir.attachment` + `tenant.log` | `HttpCase` o `TransactionCase` con `modoops.tenant` demo `modoops_admin/data/modoops_tenant_demo.xml:1` |
| `CATALOGO_MODOOPS` sync | `modoops_tenant.py:6` == `catalogo.json` | Test que carga ambos y diff |
| `modules_installed` mock vs real | Wizard no ejecuta `odoo-bin` real (documentado `tools/modoops_provision/README.md:24`) | Assert `modules_installed` string + `_log("install")` (`modoops_tenant_install_wizard.py:27`) |

### 6.3 Contrato web (solo si se habilita Fase 2)

| Seam | Qué testea | Cómo |
|------|------------|------|
| `POST /api/configurador/generar` | Auth + rate-limit + generación dual | Playwright + `web/` `astro.config.mjs` |
| `business.ts` drift | `web/src/data/business.ts:21` `publicPricing.discovery` == `$155` | Test que valida `CONTEXT.md:572` vs `business.ts` |

**Regla:** lógica pura primero (cobertura >80% ahí); wrappers solo "glue" y se testean con smoke, no con 92h de casos.

---

## 7. Recomendación operativa (para #49/#50/#51)

1. **Fase 1 (hoy → primer ancla):** Crear `tools/configurador/` con `catalogo.json` (single-source), `logic/` (precio/horas/capacidad/render), CLI `configurador.py --vertical retail --mods mostrador,deposito,compras,fiscal_ar --sku 450 --out ./out/` que emite `lista_cerrada_comercial.md`, `lista_cerrada_tecnica.md` (mapeo Odoo), `propuesta.md` + PDF vía FPDF. Tests `pytest`.
2. **Thin wizard:** `modoops.tenant.configurator.wizard` que reusa `logic/` (import relativo o `sys.path` a `tools/`), genera attachments y log. No replica lógica.
3. **Diferir web:** `#48→#52` define funnel antes; web configurador solo si operador no-dev lo exige. Mientras, CLI basta para `Descubrimiento 3 días → Informe 9 + Propuesta 10` (`docs/plantillas/descubrimiento-modoops-checklist.md:62`).
4. **Capacity store:** Fase 1 `capacidad.json` local (conteo manual activos); Fase 2 query `modoops.tenant` `state=activo` + `modoops_admin`.

Desbloquea #49 (contrato Configurador), #50 (Kit Descubrimiento), #51 (motor precios) — #52 dependerá de #48 (funnel) + #49.

---

## 8. Referencias primarias (claim → source)

- `docs/modoops-configurador.md:1` — propósito herramienta interna, output Lista cerrada
- `docs/modoops-configurador.md:21` / `docs/catalogo-modoops-inicial.md:7` — módulos validados ancla
- `docs/modoops-configurador.md:25` — Ancla $800 techo 92h 8h ajustes
- `docs/modoops-configurador.md:27` — alerta supera 92h → Fase 2
- `docs/modoops-configurador.md:29` — capacidad 2 paralelas, bloquea 3ª
- `docs/modoops-configurador.md:34` — flujo 3 pasos Tildar→Generar→Emitir
- `docs/modoops-configurador.md:38` — plantilla Lista cerrada
- `docs/modoops-configurador.md:45` — excluidos
- `docs/catalogo-modoops-inicial.md:17` / `docs/catalogo-modoops-inicial.md:28` — Taller Add-on, Migración ≤500 `MAX_IMPORT_ROWS`
- `docs/plantillas/descubrimiento-modoops-checklist.md:41` — tildar Catálogo
- `docs/plantillas/descubrimiento-modoops-checklist.md:62` — entregables Informe 9 + Propuesta 10 + Lista cerrada
- `docs/plantillas/ejemplo-descubrimiento-modoops-retail.md:33` — mig >500 tramo $78
- `docs/plantillas/ejemplo-descubrimiento-modoops-retail.md:65` — Lista cerrada 8 líneas CE 19
- `docs/plantillas/ejemplo-descubrimiento-modoops-retail.md:82` — anticipo $322.5 con crédito
- `CONTEXT.md:19` — $52/día 6h; `CONTEXT.md:28` — crédito $77.5 20d; `CONTEXT.md:32` — $10.5/h; `CONTEXT.md:39` — meta $600/mes
- `CONTEXT.md:50` + `CONTEXT.md:413` — marca blanca Odoo solo anexo técnico
- `CONTEXT.md:66` — Paquete ancla $800 50/25/25; `CONTEXT.md:69` — techo 92h; `CONTEXT.md:113` — techo 8h; `CONTEXT.md:178` — capacidad 2
- `CONTEXT.md:491` — Propuesta 10 secciones; `CONTEXT.md:479` — Informe 9; `CONTEXT.md:572` — tabla precios
- `modoops_admin/models/modoops_tenant.py:6` — `CATALOGO_MODOOPS`; `modoops_admin/models/modoops_tenant.py:115` — `action_install_module`
- `modoops_admin/models/modoops_tenant_install_wizard.py:7` — wizard mock install
- `tools/modoops_provision/provision_tenant.py:1` — CLI Multi-DB patrón a reusar
- `tools/modoops_provision/README.md:24` — wizard mock no ejecuta `odoo-bin` real
- `web/src/data/business.ts:21` — solo `$155` público, ancla tras diagnóstico
- `docs/generar_pdf_ventas_repuestos.py:1` — patrón FPDF para PDF
- `CONTEXT.md:300` — namespace `modoops.*` logic puro + wrapper
- Mapa #46 — plan-only, fuera de scope billing auto, grafo 384d local, infra Fase1 RPO 24h

---

*Fin — dejar validación humana y grilling en #49 antes de implementar CLI. Próximo: #49 contrato Configurador → #51 motor precios → #50 kit.*
