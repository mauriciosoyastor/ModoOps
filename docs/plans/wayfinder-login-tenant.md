# Wayfinder Map — Login de tenant en Astro (empleado Servigas)

> Mapa local (tracker GitHub sin auth en esta sesión — precedente `wayfinder-servigas-auditoria.md`).
> Estado: **cerrado 2026-09-08 — T1/T2/T3/T4/T5 cerrados, frontera vacía**. Destino alcanzado en
> prototipo verificado (sin commitear): login tenant con suspensión + hub inventory tenant-scoped en local.
> Handoff a `to-tickets` para la fase build (escritura por hub, resto de hubs, valor selection propio,
> tests multi-db).
> Nace del hallazgo en auditoría Servigas: el shell Astro es control-plane, no hay entrada de usuario-tenant.

## Destination

El empleado de Servigas entra por Astro (`/login` o URL tenant) contra `modoops_servigas` y opera los 5 hubs
(inventory, sales, purchase, accounting, workshop) en modo tenant-scoped, verificado en local con el stack
levantado (Odoo `:8070`, web `:3001`). Cambio en el lugar, no spec.

## Notes

- Hechos verificados 2026-09-08: `/api/auth/login` usa `getBackend()` → solo master (`web/src/pages/api/auth/login.ts:21`,
  `get-backend.ts:12`); la sesión BFF (`mo_bff_sid`) guarda `sessionId` de master. Existe `getTenantBackend(slug)`
  (`get-backend.ts:20`) y `getBackendForDb` (`:27`) pero **ningún hub los usa**: `hub/[app]` llama
  `getBackend().getHub` → master (`[app].astro:22`, `odoo-adapter.ts:95`). `ALLOWED` = 5 apps, sin POS (`[app].astro:9`).
- `/tenant/[slug]/app` es vista **admin** del tenant (gestionar módulos + chat IA), no entrada operativa — no se toca
  en este esfuerzo salvo que T1 lo decida como puerta.
- Dominio: **Tenant** = base `modoops_<slug>` (`CONTEXT.md:243`); **Contexto Tenant** = `db_name` + `tenant_id`
  (`CONTEXT.md:272`); **Estado Tenant** activo→suspendido→baja con gracia 7 días (`CONTEXT.md:249-254`); el login
  de empleado debe respetar la suspensión (ver T5).
- Skills por sesión: `grilling` + `domain-modeling` en grillings; `prototype` en prototipos; `research` en
  research (AFK); `tdd` si un task toca código.
- Término fijado 2026-09-08: **usuario tenant** (empleado) = persona dentro del negocio Cliente, acceso
  asignado a su `modoops_<slug>`, nunca ve otros tenants; distinto de **consultor** y **cliente**
  (`CONTEXT.md:47-52`).
- Puertas de `AGENTS.md`: `impact` antes de editar símbolos (`login.ts`, `get-backend.ts`, `[app].astro`,
  `session-store`, middleware) + `detect_changes` antes de commitear.
- Este mapa **lleva ejecución dentro** (override en Notes): el destino es un cambio en el lugar.

## Decisions so far

- [Mapear el seam auth](.scratch/login-tenant/issues/04-seam-auth.md) (research cerrado 2026-09-08): sesión sin `db`/`slug` (TTL 12h); `getTenantBackend` con cero usos; deben variar por db `login.ts`, `hub/[app]` y `tenant/[slug]/app`; riesgo mayor = `OdooAdapter` fija `#db` al construir + singleton master; `isSuspended` es env-based, T5 debe hacerlo Odoo-backed. Detalle en `.scratch/login-tenant/research-seam-auth.md`.
- [Flujo del login tenant](.scratch/login-tenant/issues/01-flujo-login-tenant.md) (grilling cerrado 2026-09-08, 2 rondas): URL asignada `/tenant/<slug>/login`, empleado nunca ve otros tenants; `db`+`slug` en sesión + adapter por request; reemplazo de sesión; alta manual por consultor.
- [Alcance de los hubs](.scratch/login-tenant/issues/02-alcance-hubs.md) (grilling cerrado 2026-09-08): piloto inventory, luego sales/purchase/accounting juntos; workshop fuera del done; done = lectura + 1 escritura por hub.
- [Prototipo inventory](.scratch/login-tenant/issues/03-prototipo-inventory.md) (prototype cerrado 2026-09-08, verificado en vivo sin commitear): login `/tenant/<slug>/login` + hub inventory tenant-scoped (datos Servigas); `getBackend()` intacto; infra: compose pineado a astro local + volumen `web_node_modules`.
- [Suspensión en login](.scratch/login-tenant/issues/05-suspension-login.md) (task cerrado 2026-09-08, probado en vivo): activo 200 / mala 401 / inexistente 401 / suspendido+baja 403 con mora; estado Odoo-backed; bloqueo auditado como `aviso login_bloqueado`; Servigas restaurado a activo.

## Frontier (orden)

### T1 — grilling — Flujo del login tenant (cerrado 2026-09-08, 2 rondas)

Ver Decisions so far. Desbloquea a T3 y T5.
Ticket: `.scratch/login-tenant/issues/01-flujo-login-tenant.md`.

### T2 — grilling — Alcance de los hubs (cerrado 2026-09-08)

Ver Decisions so far. La usa T3.
Ticket: `.scratch/login-tenant/issues/02-alcance-hubs.md`.

### T3 — prototype — Login + hub inventory (cerrado 2026-09-08, verificado en vivo)

Ver Decisions so far. Queda T5 (desbloqueado).
Ticket: `.scratch/login-tenant/issues/03-prototipo-inventory.md`.

### T4 — research — Mapear el seam auth (cerrado 2026-09-08)

Inventario resuelto en paralelo al charting — ver Decisions so far.
Ticket: `.scratch/login-tenant/issues/04-seam-auth.md`.

### T5 — task — Suspensión en login (cerrado 2026-09-08, probado en vivo)

Ver Decisions so far. Mapa completo.
Ticket: `.scratch/login-tenant/issues/05-suspension-login.md`.

## Not yet specified

- Selector visual de tenant (¿lista de tenants visibles para un empleado multi-tenant o un empleado = un tenant?).
  Gradúa con T1.
- Permisos por rol de empleado (vendedor vs depósito): ¿grupos Odoo existentes alcanzan o hay rol nuevo?
  Gradúa con T2.
- Sesión compartida consultor↔empleado en el mismo browser (¿dos cookies o una con doble cursor?).
  Gradúa con T1.
- Chat IA del empleado: ¿usa su sesión tenant o apiKey como hoy? Gradúa con T1/T3.

## Out of scope

- Mostrador/POS como hub Astro (no existe; el POS sigue nativo en `/pos/ui` — esfuerzo nuevo si se quiere).
- `/tenant/[slug]/app` admin salvo que T1 lo redibuje como puerta (queda como está).
- Deploy productivo / Vercel / multi-tenant single-DB (solo local, una base por tenant).
- Nuevo modelo Odoo para empleados salvo que T2 lo exija.
