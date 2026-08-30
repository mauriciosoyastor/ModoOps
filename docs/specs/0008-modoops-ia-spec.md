# Spec — ModoOps IA: Agente herramental, Herramientas y Orquestador BFF Astro

> ADR base: `0008-modoops-ia-agente-herramental-bff` + `0006-multitenant-centralizado-faseado` + `0007-control-plane-master`. Glosario canónico: `CONTEXT.md` sección `Agentes IA (ModoOps IA — modoops_ia)`.

## Problem Statement

Un comercio PYME (1 sucursal, ~5 usuarios, Operativo en mostrador) quiere resolver tareas operativas hablando en lenguaje natural dentro del Shell Astro BFF, sin exponer la UI nativa de Odoo ni romper el aislamiento `Tenant = modoops_<slug>` (`modoops_admin/models/modoops_tenant.py:18`). Hoy no existe un lenguaje de código único para que una IA ejecute acciones: cualquier agente improvisaría `env['model'].write` por fuera de `Herramienta`, sin `Contexto Tenant`, sin validar `modoops.fiscal_enabled` (`modoops_core/models/modoops_fiscal_guard.py:11`), sin pasar por `Suspensión por mora` (`CONTEXT.md:253` gracia 7 días) y sin techo de costo. El consultor no puede ofrecer IA en producción sin riesgo de fuga cross-tenant, escalada a `base.group_system` por cookie, o costo LLM ilimitado que erosiona el `Abono mensual $45/mes 4h + best effort bugs` (`CONTEXT.md:190`).

## Solution

Un único **Agente ModoOps** herramental, tenant-aislado, cuyo chat es solo UI. El Agente nunca escribe sin una **Herramienta ModoOps** auditada. El Catálogo de Herramientas vive en `modoops_master` (control comercial) y cada invocación se ejecuta en la DB del Tenant con **Contexto Tenant** (`db_name` + `tenant_id`) inyectado. Toda corrida pasa obligatoriamente por el **Orquestador ModoOps (BFF Astro)** que valida `api_key` por Tenant, enforza `Techo IA` y `Suspensión por mora`, hace rate-limit y audita en `modoops.tenant.log` (`modoops_tenant.py:104`) antes de tocar Odoo. Sin Herramienta: **Falla cerrada / Modo borrador** (CSV/preview revisable o `mail.activity`) con posible upselling a **Cambio** `$10.5/h` o Add-on. Código IA nuevo nace en `modoops.*` (`modoops_ia/logic/` puro sin ORM + wrapper), `mo.*` queda legacy Servigas congelado.

## User Stories

1. Como Operativo de mostrador logueado en shell Astro, quiero preguntar "¿cuánto stock de X?" y que el Agente responda consultando la Herramienta de stock del Tenant correcto, sin ver datos de otro Tenant.
2. Como Operativo, quiero decir "registrá cobro de OT 123 por $1500 en efectivo" y que el Agente invoque la Herramienta que envuelve `mo.work.order action_collect_cash` (`mo_work_order.py:102`) solo si hay caja abierta (`mo.cash.session`), registrando `mo.cash.movement` y auditando la corrida.
3. Como Operativo, quiero pedir "importá esta lista de precios XLSX" y que el Agente use la Herramienta que envuelve `mo_price_list_import_logic.parse_tabular_bytes` (`mo_price_list_import_logic.py:299`) y me devuelva un preview clasificatorio antes de escribir (lógica pura separada).
4. Como Agente ModoOps, quiero recibir siempre `Contexto Tenant` del Orquestador y rechazar cualquier invocación sin `db_name`, para nunca abrir cursor fuera de `modoops_<slug>`.
5. Como Agente ModoOps, quiero que toda Herramienta declare `input_schema`, `groups_id` requeridos y regla de auditoría, para que el Orquestador pueda validar permisos antes de ejecutar.
6. Como Orquestador ModoOps, quiero validar `api_key` por Tenant contra `ir.config_parameter` y rechazar con 401 si no coincide, sin exponer Odoo con `auth='public'` (`controllers.py:5` contra-ejemplo).
7. Como Orquestador, quiero bloquear corridas si el Tenant está `Suspendido` (`modoops_tenant.py:52` `state`), devolviendo 403 con mensaje de mora y sin tocar la DB del Cliente.
8. Como Orquestador, quiero enforzar `Techo IA` (cuota mensual de ejecuciones/tokens incluida en Abono) antes de ejecutar; si está excedido, bloquear con 429 y sugerir Add-on IA / bolsa `$10.5/h`.
9. Como Dueño del Tenant, quiero que la Memoria del Agente (historial, preferencias "facturar siempre como consumidor final") viva cifrada en mi DB (`modoops_<slug>`), con retención 90 días purgable, nunca en `modoops_master` ni en logs del BFF.
10. Como Agente, quiero que si no existe Herramienta para la tarea, no improvise un `write` sino que genere un borrador revisable (CSV/preview) o cree una `mail.activity` para el consultor humano.
11. Como Consultor ModoOps, quiero que ese borrador sea cotizable automáticamente como **Cambio** o **Add-on**, sin mezclar con `Techo de ajustes técnicos 8h` (`CONTEXT.md:112`).
12. Como Asesor fiscal del Cliente, quiero que cualquier Herramienta que intente `account.move action_post` pase por `modoops.fiscal_enabled` (`modoops_fiscal_guard.py:20`) y falle si el anexo fiscal no está firmado.
13. Como Cliente en mora, quiero recibir aviso WhatsApp/email antes de la suspensión (gracia 7 días) y que el Agente se bloquee exactamente al vencer `suspend_grace_until` (`modoops_tenant.py:58`), no antes.
14. Como Control Plane (`modoops_admin` en `modoops_master`), quiero listar Herramientas disponibles del Catálogo y habilitar/deshabilitar por Tenant (instalación lógica, no `odoo-bin -i` físico para IA).
15. Como Control Plane, quiero ver en `modoops.tenant.log` cada Ejecución (fecha, tenant, herramienta, input resumido, output, actor Agente vs humano) para soporte post-Hipercare.
16. Como Consultor, quiero configurar credenciales externas por Tenant (ej: API key MercadoPago) en la DB del Tenant ejecutante, nunca en el Catálogo central.
17. Como Desarrollador ModoOps, quiero que toda lógica IA pura viva en `modoops_ia/logic/` sin ORM, testeable sin DB, siguiendo `mo_price_list_import_logic.py:1`, y el wrapper Odoo solo valide permisos y delegue.
18. Como Desarrollador, quiero que nuevo código IA use namespace `modoops.*` (`modoops.agent`, `modoops.agent.tool`, `modoops.agent.run`) y no `mo.*` legacy, para no heredar deuda Servigas (`mo.work.order:6`).
19. Como Operativo, quiero que el Agente nunca escale a `base.group_system` automáticamente; si una Herramienta requiere `account.group_account_manager` (`mo_cash_session.py:197` retiro del dueño), debe validar el grupo del usuario efectivo.
20. Como Orquestador, quiero hacer rate-limit por Tenant y por Herramienta para mitigar loops del LLM que disparen costo variable.
21. Como Cliente PYME, quiero que el chat del Agente viva dentro del Shell Astro BFF (Liquid Glass), no en la UI OWL nativa de Odoo (`modoops_core` hubs).
22. Como Consultor, quiero que la instalación IA sea un Módulo ModoOps más del Catálogo (`modoops_ia`) seleccionable por el Configurador, sin precio público distinto al Abono hasta diagnóstico.
23. Como Auditor, quiero que cada Ejecución sea idempotente si se reintenta con mismo `request_id` (evita doble cobro en `mo.cash.movement`).

## Implementation Decisions

- **Módulo único**: `modoops_ia` (LGPL-3, depends `modoops_core` + `modoops_admin`). No tocar `mo.*` legacy. Modelos: `modoops.agent`, `modoops.agent.tool` (definición catálogo, en `modoops_master`), `modoops.agent.run` / `modoops.agent.memory` (ejecución y memoria, solo en Tenant).
- **Catálogo en master, ejecución en tenant**: Definición viva en `modoops_master` (control comercial Add-on/Abono), ejecución siempre `with Contexto Tenant` (`db_name` inyectado). Credenciales externas resueltas `env` del Tenant, no del catálogo — decisión explícita de Ronda 1 Q2.
- **Herramienta como única vía**: Cada Herramienta = `input_schema` JSON, `groups_id` (reusa `mo_app_tile.py:37` pattern), `module_required` opcional, `logic_fn` pura + `model/method` wrapper con `_check` y log. Sin Herramienta no hay `write` (Falla cerrada).
- **Lógica pura aislada**: `modoops_ia/logic/` sin `odoo` import, como `mo_price_list_import_logic.py:1` (`MAX_IMPORT_ROWS=500`, `parse_tabular_bytes`, `FIELD_ALIASES`). Wrapper `models/` valida `groups_id` y `modoops.fiscal_enabled` antes de delegar. Permite tests Node/Python sin DB ni Odoo.
- **Orquestador BFF Astro**: Contrato externo único `POST /api/modoops/:dbName/agent/run` (`{tool, input, requestId, apiKey}` → `{status, output, runId}`) + `GET /api/modoops/:dbName/agent/tools` (lista catálogo filtrada por `groups_id`). Implementado en `web/src/pages/api/` o `worker.js` (Astro SSR/BFF, hoy `worker.js:1` solo sirve `env.ASSETS`). Alternativa Odoo `auth='api_key'` directo rechazada (ADR 0008).
- **Auth**: `api_key` por Tenant en `ir.config_parameter` `modoops.agent.api_key.<slug>` (hasheada), validada en BFF. No cookie de sesión, no `auth='public'`.
- **Techo IA**: Contador mensual en `modoops.tenant.log` (filtrado por `action='agent.run'`), leído en BFF antes de ejecutar. Config en `modoops.tenant` (`agent_quota_month`, `agent_usage_month`). Exceso → 429 bloquea; no consume `Hipercare` ni `Techo de ajustes 8h`.
- **Suspensión**: BFF consulta `modoops.tenant.state` en `modoops_master` antes de cada corrida; `suspendido` → 403. Gracia calculada `suspend_grace_until = abono_due_date + 7d` (`modoops_tenant.py:58` compute) ya existente.
- **Memoria**: Tabla `modoops.agent.memory` en Tenant, `field encrypted` (pgcrypto), `retention 90d` cron purgable por setting. Nunca en master, nunca en logs BFF. Backup incluido en `provision_tenant.py:52` cron S3 (filestore si hay embeddings).
- **Falla cerrada / Modo borrador**: Contrato de salida del Agente: `{status:'needs_tool', draft:{csv|preview}}` o `{status:'needs_human', activityId}`. El BFF crea `mail.activity` en Tenant si corresponde. No `env[model].write` improvisado.
- **Idempotencia**: `requestId` (client UUID) único por Herramienta+Tenant, indexado en `modoops.agent.run`, evita doble `mo.cash.movement` en reintentos.
- **Fiscal**: Wrapper de cualquier Tool que toque `account.move` llama a `modoops_fiscal_guard._is_fiscal_enabled` antes de `super().action_post()`, igual que `modoops_fiscal_guard.py:20`.
- **Namespace**: Todo IA en `modoops.*`; `mo.*` congelado. Documentado en `CONTEXT.md` Flagged ambiguities y `Namespace modoops.* vs mo.*`.

## Testing Decisions

- **Qué hace un buen test aquí**: Probar comportamiento externo observable en el Orquestador y en la Herramienta, no detalles internos del LLM. Un test emula `fetch POST /api/modoops/:db/agent/run` con `apiKey` y `Contexto Tenant` y aserta `status` + side-effect en DB Tenant (`mo.cash.session`/`mo.work.order` o memoria), no el prompt.
- **Seams elegidos (de más alto a más bajo, uno ideal)**:
  - **Seam 1 — Contrato BFF (más alto, preferido)**: `POST /api/modoops/:db/agent/run`. Es el seam de producción real; cubre auth, techo, suspensión, routing y auditoría sin tocar Odoo directo. Tests de contrato + e2e contra BFF mock + DB Tenant efímera.
  - **Seam 2 — Lógica pura** (`modoops_ia/logic/*`): sin ORM, testeable offline con fixtures (patrón existente `modoops_core/tests/test_mo_price_list_import_logic.py`). Usado para validar `input_schema` y `parse/classify` sin levantar Odoo.
  - **Seam 3 — Wrapper Odoo** (`modoops.agent.tool` → `model/method`): tests de integración Odoo que validan `groups_id`, `fiscal_enabled` y `modoops.tenant.log` write. Solo para herramientas con side-effect.
  - Propuesta: **dos seams activos** (BFF + lógica pura) cubren >80%; wrapper solo para herramientas con permiso fiscal/caja. Evitar seam por Herramienta.
- **Prior art**: `test_mo_price_list_import_logic.py` (lógica pura, sin Odoo), `test_mo_work_order_shell.py` / `mo_chatter_policy.test.mjs` (comportamiento de modelo), `mo_onboarding_tour.test.mjs` (flujo). Reusar estructura de `mo_price_list_import_logic` para Herramientas de importación/preview.
- **Cobertura mínima**: auth inválida→401, tenant suspendido→403, techo excedido→429, herramienta sin permiso→403, idempotencia requestId, memoria cifrada + purga, fiscal bloqueado cuando `modoops.fiscal_enabled=False`.

## Out of Scope

- `--pdg` / PDG layer, taint, CDG/REACHING_DEF Haystack: no requisito MVP, queda fog (`CONTEXT.md` Grafo GitNexus nota `Sin --pdg`).
- Grafo por Tenant como multi-DB para embeddings (`graph+fts+vector 384 dims` se mantiene en repo ModoOps, `CONTEXT.md` Grafo nota: `fts/vector: available` + `stats.embeddings>0` + `embeddingDims==384` como paridad; grafo por tenant es plantilla futura, no Fase 1).
- Chat LLM proveedor (OpenAI/Anthropic) elección y prompt engineering fino; el spec fija el contrato Orquestador/Herramienta, no el vendor.
- Ingesta/migración histórica >500 filas (`MAX_IMPORT_ROWS=500` en `mo_price_list_import_logic.py:89` límite vigente; >500 = tramo extra días×$52).
- Billing automático del Techo IA (primero conteo y bloqueo; facturación manual vía Abono/Add-on, Control Plane Fase 1 manual).
- Multi-tenant single-DB con `tenant_id` (explícitamente rechazado en `CONTEXT.md:236`).

## Further Notes

- **Tracker**: repo remoto `github.com/mauriciosoyastor/ModoOps` (`git remote -v`); este spec se publica como markdown local `docs/specs/0008-modoops-ia-spec.md` y `.scratch/modoops-ia/spec.md` hasta completar `docs/agents/issue-tracker.md` vía `/setup-matt-pocock-skills`. Etiqueta conceptual `ready-for-agent`.
- **Coste**: `publicPricing.discovery $155` sigue siendo único precio público; Abono y Add-on IA "tras diagnóstico" (`web/src/data/business.ts:21`).
- **Próximo paso**: `/to-tickets` desde este spec (tickets: 1) BFF Orquestador + Techo/Suspensión, 2) `modoops_ia` catálogo + wrapper + 1 tool referencia (ej: `stock` consulta), 3) Memoria cifrada + purga, 4) Falla cerrada/borrador + mail.activity).
