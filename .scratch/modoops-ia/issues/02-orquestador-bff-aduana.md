# 02: Orquestador BFF Astro — aduana obligatoria (auth + suspensión + techo + log)

**What to build:** Como Operativo, `POST /api/modoops/:dbName/agent/run {tool,input,requestId,apiKey}` solo ejecuta si `apiKey` valida en `modoops_master`, Tenant no `Suspendido` y `Techo IA` no excedido; si no, 401/403/429 sin tocar Odoo. Si pasa, inyecta `Contexto Tenant` (`dbName`), audita en `modoops.tenant.log` y dispacha a tool `echo` dummy. `GET /api/modoops/:dbName/agent/tools` lista catálogo filtrado por `groups_id`.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `POST` con `apiKey` inválida → 401, sin `modoops.tenant.log`
- [ ] Tenant `Suspendido`/`suspend_grace_until` vencida → 403, sin ejecución
- [ ] `Techo IA` excedido → 429 bloquea antes de Odoo
- [ ] `POST` válido → 200 + `runId` + entrada `modoops.tenant.log` con `tenant_id/db_name/tool/input`
- [ ] Rate-limit por Tenant/Herramienta activo
