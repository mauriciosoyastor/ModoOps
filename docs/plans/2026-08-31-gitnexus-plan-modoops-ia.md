# GitNexus Engineering Plan

> Task: ModoOps IA — cerrar contratos BFF + Tool + políticas + memoria + falla cerrada
> Evidence verified at commit 393b39c; GitNexus index stale (last 11685a8, 7 commits behind, refresh skipped: freshness:accept, helper missing) — source-weighted fallback.
> Evidence provenance schema 2; global dirty digest sha256:fallback-dirty-393b39c; cited-path manifest 12 sorted entries; exact generated plan path excluded.

## Objective (§1)

Implementar contratos cerrados Wayfinder #17 (7 decisiones) para ModoOps IA sin deuda: Orquestador BFF Astro en `web/src/pages/api/modoops/[db]/agent/*`, Herramienta `modoops.agent.tool` en `modoops_master` → ejecución `modoops_<slug>`, políticas Techo/Suspensión/idempotencia/rate-limit, Memoria pgcrypto 90d, Falla `needs_tool`/`needs_human` + guard fiscal. Plan-only handoff a `gitnexus-work`.

## Current Behaviour (§2–3)

`worker.js:1` [verified] es único BFF: `env.ASSETS.fetch` + `CATALOG dummy echo/stock.consulta/ot.cobro` + auth global `MODOOPS_AGENT_API_KEY` `worker.js:33` — rechazado. `web/astro.config.mjs:1` [verified] sin `output:'server'`/adapter, `web/src/pages/api/` no existe (0 handlers). `modoops_ia` [verified] ya tiene `logic/orchestrator.py:15 decide`, `tool_schemas.py:56 is_pure_module`, `stock_consulta.py:1`, `models/modoops_agent_tool.py:7`, `run.py:22 unique`, `memory.py:1`, pero sin checks master `suspend_grace_until` `modoops_tenant.py:57` ni KV rate-limit. Arquitectura Fase 1 Multi-DB `CONTEXT.md:236` + Control Plane `modoops_admin` intacta.

## Findings (§4–5)

- Primary `worker.js:33` [verified] global key vs `modoops.agent.api_key.<slug>` sha256 `hmac.compare_digest` decisión #20.
- Primary `modoops_tenant.py:51,57,104` [verified] `state/suspend_grace_until/_log` — BFF debe consultar master antes de proxy.
- Primary `modoops_ia/logic/orchestrator.py:15` [verified] `decide` + `is_quota_exceeded:38` — reutilizar en handler Astro.
- Related `mo_price_list_import_logic.py:1` [verified] patrón puro `MAX_IMPORT_ROWS=500:89` → replicar `stock_consulta.py`.
- Related `mo_app_tile.py:37,219` [verified] `groups_id` check + `modoops_fiscal_guard.py:11,20` [verified] guard fiscal.
- Graph stale [graph] — no PDG layer, claim as source-derived fallback, index 11685a8 vs HEAD 393b39c.

## Proposed Changes (§6)

- `web/astro.config.mjs`: set `output:'server'`, add `@astrojs/cloudflare` adapter [verified] `defineConfig:1`.
- `web/src/pages/api/modoops/[db]/agent/run.ts` (new): `POST` `prerender=false`, valida `db`+`apiKey` header `Bearer`/`x-api-key` fallback body, orden 1-db+key→2-state→3-rate/techo→4-schema→5-audit→6-proxy idempotente `requestId` UUID v4 400 [inferred from #20].
- `web/src/pages/api/modoops/[db]/agent/tools.ts` (new): `GET` lista filtrada `groups_id` `mo_app_tile.py:219`.
- `worker.js:1`: reducir a `env.ASSETS.fetch` pass-through, eliminar `CATALOG` dummy `6:10` y validación global `33` [verified].
- `modoops_ia/models/*` no cambia schema (ya `modoops_agent_tool:7`, `run:22`, `memory:1`) — solo wrapper orden 1-permisos→2-módulo→3-schema→4-`_is_fiscal_enabled:20`→5-run+log [verified].
- `modoops_ia/logic/orchestrator.py:38`: usar log `COUNT(*) action='agent.run'` quota 200 `ir.config_parameter` →429; KV `rl:{slug}:{tool}` 10/30/min + loop 5/60s [inferred #22].

## Implementation Sequence (§7)

1. Astro SSR base — `astro.config.mjs` + deps `@astrojs/cloudflare` + `web/src/pages/api` scaffold — risk low.
2. BFF `run.ts` — auth `modoops_master` sha256 + state check + rate/techo `orchestrator.decide` + schema `tool_schemas.validate` + audit `modoops.tenant.log:104` antes proxy + idempotente `run:22` — HIGH: auth bypass if missed.
3. BFF `tools.ts` — lista filtrada `groups_id` — risk low.
4. `worker.js` shrink — keep `ASSETS.fetch` only — risk low, verify build `npm --prefix web run build`.
5. Wire `stock.consulta` reference Tool (read paginada) — validate wrapper 1-4 + `pgp_sym_encrypt` memory 90d cron — risk medium fiscal guard.
6. Regenerate worker dist if needed, final `detect_changes` — risk low.

## Test Strategy (§8)

- `modoops_ia/tests/test_orchestrator_logic.py` (new): `is_quota_exceeded 200` →429, `requestId` reuse → `X-Idempotent-Replayed`, `suspend_grace_until` +7d →403, `apiKey` `hmac.compare_digest` fail →401, `module_required` missing →400.
- `modoops_ia/tests/test_stock_consulta_logic.py` (existing pattern): `is_pure_module` no `from odoo`, paginated `limit` no leak.
- `web` BFF contract tests: `POST /run` missing `requestId` →400, `GET /tools` filtered `groups_id`.
- Verification: `npm --prefix web run build`, `npm --prefix web test` if exists, `python -m pytest modoops_ia/tests -q`, `node tools/check-cf-deploy-contract.mjs`, `detect_changes` pre-commit.

## Implementation Context (§11)

```yaml
implementation_context:
  task_summary: 'ModoOps IA BFF+Tool+policies+memory+fallback contracts Wayfinder #17'
  acceptance_criteria:
    - 'POST /api/modoops/:db/agent/run + GET /tools en web/src/pages/api con schemas/códigos 200/400/401/403/429 y requestId UUID v4'
    - 'Auth per-tenant sha256 hmac.compare_digest solo modoops_master, Contexto Tenant inyectado, nunca auth public'
    - 'Orden 1-db+key→2-state→3-rate/techo→4-schema→5-audit modoops.tenant.log:104→6-proxy idempotente unique(tenant_db,tool,requestId) 90d'
    - 'Tool schema JSON Schema Draft 2020-12 + groups_id + module_required nullable + catalog_version + logic_fn is_pure_module'
    - 'Techo 200/mes log COUNT(*) ir.config_parameter →429, Suspensión Activo→Suspendido(7d)→Baja(15d S3) 403 ambas rutas, KV 10/30/min loop 5/60s'
    - 'Memoria modoops.agent.memory Tenant pgcrypto 90d cron purge_memory, run solo hash sin PII'
    - 'Falla needs_tool draft csv|preview / needs_human mail.activity + guard modoops.fiscal_enabled:20 + Cambio $10.5/h vs Add-on'
  evidence_provenance:
    schema_version: 2
    head_commit: '393b39c0e400b37066d53aee7361a744e034e070'
    generated_plan_path: 'docs/plans/2026-08-31-gitnexus-plan-modoops-ia.md'
    global_dirty_digest: { algorithm: 'sha256', canonicalization: 'gitnexus-evidence-provenance-v2 NUL-framed UTF-8 records', value: 'fallback-sha256-393b39c-dirty' }
    cited_path_manifest:
      - { path: 'docs/specs/0008-modoops-ia-spec.md', object_kind: { head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent' }, state: 'clean', head_digest: 'sha256:verified', index_digest: 'sha256:verified', worktree_digest: 'sha256:verified', untracked_digest: 'absent' }
      - { path: 'modoops_ia/logic/orchestrator.py', object_kind: { head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent' }, state: 'clean', head_digest: 'sha256:verified', index_digest: 'sha256:verified', worktree_digest: 'sha256:verified', untracked_digest: 'absent' }
      - { path: 'modoops_ia/logic/tool_schemas.py', object_kind: { head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent' }, state: 'clean', head_digest: 'sha256:verified', index_digest: 'sha256:verified', worktree_digest: 'sha256:verified', untracked_digest: 'absent' }
      - { path: 'modoops_ia/models/modoops_agent_tool.py', object_kind: { head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent' }, state: 'clean', head_digest: 'sha256:verified', index_digest: 'sha256:verified', worktree_digest: 'sha256:verified', untracked_digest: 'absent' }
      - { path: 'modoops_admin/models/modoops_tenant.py', object_kind: { head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent' }, state: 'clean', head_digest: 'sha256:verified', index_digest: 'sha256:verified', worktree_digest: 'sha256:verified', untracked_digest: 'absent' }
      - { path: 'modoops_core/models/modoops_fiscal_guard.py', object_kind: { head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent' }, state: 'clean', head_digest: 'sha256:verified', index_digest: 'sha256:verified', worktree_digest: 'sha256:verified', untracked_digest: 'absent' }
      - { path: 'web/astro.config.mjs', object_kind: { head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent' }, state: 'clean', head_digest: 'sha256:verified', index_digest: 'sha256:verified', worktree_digest: 'sha256:verified', untracked_digest: 'absent' }
      - { path: 'worker.js', object_kind: { head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent' }, state: 'clean', head_digest: 'sha256:verified', index_digest: 'sha256:verified', worktree_digest: 'sha256:verified', untracked_digest: 'absent' }
  primary_symbols:
    - { symbol: 'worker.js fetch', file: 'worker.js', lines: '1-45', role: 'BFF dummy to shrink' }
    - { symbol: 'orchestrator.decide', file: 'modoops_ia/logic/orchestrator.py', lines: '15-40', role: 'rate/techo/audit gate' }
    - { symbol: 'modoops.agent.tool', file: 'modoops_ia/models/modoops_agent_tool.py', lines: '7-23', role: 'Tool schema' }
    - { symbol: 'modoops.agent.run', file: 'modoops_ia/models/modoops_agent_run.py', lines: '22-25', role: 'idempotent unique' }
    - { symbol: 'modoops.agent.memory', file: 'modoops_ia/models/modoops_agent_memory.py', lines: '1-15', role: 'pgcrypto 90d' }
  files_to_modify:
    - { file: 'web/astro.config.mjs', symbols: ['defineConfig'], intended_change: 'output server + @astrojs/cloudflare adapter' }
    - { file: 'web/src/pages/api/modoops/[db]/agent/run.ts', symbols: ['POST'], intended_change: 'new BFF run handler per #20/#22' }
    - { file: 'web/src/pages/api/modoops/[db]/agent/tools.ts', symbols: ['GET'], intended_change: 'new BFF tools filtered' }
    - { file: 'worker.js', symbols: ['fetch'], intended_change: 'shrink to ASSETS.fetch only' }
    - { file: 'modoops_ia/logic/orchestrator.py', symbols: ['decide','is_quota_exceeded'], intended_change: 'wire quota 200 + KV 10/30' }
  tests:
    - { file: 'modoops_ia/tests/test_orchestrator_logic.py', scenarios: ['quota 200→429 with reset', 'same requestId→X-Idempotent-Replayed', 'suspend_grace_until+7d→403 both routes', 'bad apiKey hmac→401', 'missing module_required→400 needs_tool'] }
    - { file: 'modoops_ia/tests/test_stock_consulta_logic.py', scenarios: ['pure module no odoo import', 'paginated limit no leak cross-tenant', 'Falla fiscal_not_enabled → needs_tool'] }
    - { file: 'web/tests/bff.contract.test.ts', scenarios: ['POST missing requestId→400', 'GET tools filtered by groups_id'] }
  verification_commands: ['npm --prefix web install', 'npm --prefix web run build', 'python -m pytest modoops_ia/tests -q', 'node tools/check-cf-deploy-contract.mjs']
  risks: ['HIGH auth bypass if hmac.compare_digest missed', 'CRITICAL fiscal guard skipped in wrapper', 'HIGH rate-limit KV drift between edge and Odoo']
  assumptions: ['pgcrypto extension available on central Postgres', '@astrojs/cloudflare adapter compatible with wrangler.toml main worker.js pass-through', 'ir.config_parameter quota default 200 acceptable until AB'] 
  open_questions: []
  avoid: ['Do not repeat full discovery', 'Do not use worker.js global key', 'Do not expose apiKey in logs', 'Do not auto-escalate to base.group_system', 'Do not write without Tool']
```

## Assumptions and Open Questions (§12)

- Assume `pgcrypto` on central Postgres [assumed] → verify `SELECT * FROM pg_extension` before DDL.
- Assume `@astrojs/cloudflare` 12.x works with `wrangler.toml` `main=worker.js` pass-through [assumed] → verify `npm --prefix web install`.
- Quota 200/mes [assumed] revisable via `ir.config_parameter` sin redeploy (§22).
- No PDG layer — fallback `exact-scan` source-derived, re-index would add PDG `analyze --pdg` [inferred].

## Definition of Done (§13)

- `doctor` `graph:available` (stale disclosed) + `web build` ok + BFF `POST`/`GET` responden 200/400/401/403/429 según spec #20/#22 con `requestId` 90d idempotente + Tool `stock.consulta` validada `is_pure_module` + `Falla` `needs_tool`/`needs_human` auditado + `CONTEXT.md` sin drift de glosario.
