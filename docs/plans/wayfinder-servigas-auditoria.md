# Wayfinder Map — Servigas como tenant auditor (modoops_servigas en stack ModoOps)

> Mapa local (tracker GitHub sin auth en esta sesión — se sigue precedente `wayfinder-control-plane.md:3` y `wayfinder-portal-onboarding-3d.md:3`).
> Estado: **cerrado 2026-09-08 — T1/T2/T3/T4/T5 cerrados, frontera vacía**. Destino alcanzado:
> tenant `modoops_servigas` corriendo (8070/5434/3001) con seed mínimo y harness 8/8; veredictos UI manuales
> en manos del humano (tabla del harness).

## Destination

El tenant **Servigas** (`db modoops_servigas`, `slug servigas`) queda **levantado y corriendo** en el stack ModoOps local
(Odoo `:8070`, PG `:5434`, web `:3001`, `ODOO_URL=http://odoo:8069` interna) con datos de prueba, y la auditoría
full-stack (Mostrador, Depósito Inteligente, Ventas, Compras, Fiscal AR, Contactos, Plataforma ModoOps,
Puente Factura Web, Taller, IA ModoOps) queda ejecutada contra él. Cambio en el lugar, no spec.

## Notes

- Verificación hecha 2026-09-08: Servigas **sí existe** como tenant demo — `modoops_admin/data/modoops_tenant_demo.xml:14`
  `demo_tenant_servigas` (`db_name modoops_servigas`, `slug servigas`, `vertical retail`, `state activo`,
  `abono_due_date 2026-10-31`, catálogo completo + IA). Notas anclan `CONTEXT.md:5` (Caso Retail validado
  Odoo 19 + Astro BFF + Liquid Glass v2).
- Servidor **caído ahora**: Docker Desktop apagado (npipe ausente), `curl 8070 FAIL`, `curl 3001 FAIL`.
  `web/.env` ya tiene `MODOOPS_AGENT_API_KEY_SERVIGAS=dev-servigas-key-123`, `ODOO_URL=http://localhost:8070`,
  `ODOO_DB=modoops_master`, `VIDEO_ACCESS_URL=https://video.stub/nuevo`.
- Puertos: `compose.yml:3` evita colisión con Servigas original (`8069/5433`); dev usa `8070:8069` + `5434:5432`.
  Este esfuerzo levanta el **tenant en ModoOps** (8070/5434), no el Servigas original.
- Dominio: **Tenant** = base aislada `modoops_<slug>`, no usuario ni sucursal (`CONTEXT.md:243`);
  **Contexto Tenant** = par `db_name` + `tenant_id` inyectado (`CONTEXT.md:272`); **Orquestador BFF** valida
  api_key por tenant y audita en `modoops.tenant.log` (`CONTEXT.md:268`); `mo.*` = legacy Servigas congelado,
  código IA nuevo en `modoops.*` (`CONTEXT.md:301`).
- Skills por sesión: `grilling` + `domain-modeling` en grillings; `prototype` en prototipos; `research` en
  research (AFK); `tdd` si un task toca código.
- Índice GitNexus 7 commits detrás de HEAD (`b5bce17`); `detect_changes(scope:all)` da 0 símbolos — no es
  all-clear. Cambios sin commitear: `Contact.astro`, `Hero.astro`, `BaseLayout.astro`, `index.astro` (M) +
  prototipo oficina 3D, `oficina-mapping.ts`, spec portal onboarding (??). La auditoría los cubre.
- Este mapa **lleva ejecución dentro** (override de "Plan, don't do" en Notes): el destino es un cambio
  en el lugar, no una spec.

## Decisions so far

- [Mapear implementaciones a auditar](.scratch/servigas-auditoria/issues/04-mapear-implementaciones.md) (research cerrado 2026-09-08): superficie real = Odoo + BFF + compose; landing/prototipo/legal/contrato-v3 son contexto, no objetivos de test. Puente Factura Web no existe como código (proceso manual). Inventario en `.scratch/servigas-auditoria/research-mapear-implementaciones.md`.
- [Prender stack](.scratch/servigas-auditoria/issues/01-prender-stack.md) (task cerrado 2026-09-08): Docker + compose arriba — db `:5434` healthy, Odoo `:8070` 200, web `:3001` 200 (reinstalación limpia de `node_modules` en contenedor), ollama up.
- [Matriz de auditoría full-stack](.scratch/servigas-auditoria/issues/03-matriz-auditoria.md) (grilling cerrado 2026-09-08, 2 rondas): escala fiel/diverge/corrige-ya; evidencia mixta (captura UI + curl/log BFF); IA = 1 humo + contrato; Fiscal = estándar + add-on; Puente = solo nota; datos mínimo viable.
- [Tenant modoops_servigas arriba](.scratch/servigas-auditoria/issues/02-tenant-servigas-arriba.md) (task cerrado 2026-09-08): 10/10 módulos en master + servigas; Servigas activo al 2026-10-31; seed mínimo (2 productos + proveedor y cliente demo ids 9/10); Taller = legacy `mo.*` en modoops_core.
- [Harness de auditoría](.scratch/servigas-auditoria/issues/05-harness-auditoria.md) (prototype cerrado 2026-09-08): `.scratch/servigas-auditoria/harness-auditoria.ps1` 8/8 PASS (Odoo + Orquestador + humo IA + falla cerrada); contratos duros hallados: `requestId` UUID v4, `stock.consulta` exige `product_id`.

## Frontier (orden)

### T1 — task — Prender stack (cerrado 2026-09-08)

Ver Decisions so far. Stack arriba: db + Odoo + web + ollama.
Ticket: `.scratch/servigas-auditoria/issues/01-prender-stack.md`.

### T2 — task — Tenant modoops_servigas arriba con módulos + seed (AFK, bloqueado por T1)

### T2 — task — Tenant modoops_servigas arriba (cerrado 2026-09-08)

Ver Decisions so far. Desbloquea a T5.
Ticket: `.scratch/servigas-auditoria/issues/02-tenant-servigas-arriba.md`.

### T3 — grilling — Matriz de auditoría full-stack (cerrado 2026-09-08, 2 rondas)

Ver Decisions so far. Matriz fijada; la usa T5.
Ticket: `.scratch/servigas-auditoria/issues/03-matriz-auditoria.md`.

### T4 — research — Mapear implementaciones a auditar (AFK, cerrado 2026-09-08)

Inventario resuelto en paralelo al charting — ver Decisions so far. No reabrir salvo que cambie el HEAD.
Ticket: `.scratch/servigas-auditoria/issues/04-mapear-implementaciones.md`.

### T5 — prototype — Harness de auditoría (cerrado 2026-09-08)

Ver Decisions so far. Asset 8/8; tabla UI manual pendiente del humano.
Ticket: `.scratch/servigas-auditoria/issues/05-harness-auditoria.md`.

## Not yet specified

- Datos de prueba del tenant: ¿catálogo realista (cuántos productos, stock inicial) o mínimo viable por módulo?
  (gradúa con T2; el SKU Migración catálogo ≤500 es referencia).
- IA en el tenant: ¿corridas de prueba contra Orquestador con quota dev (200) o solo contrato apiKey + falla
  cerrada? (gradúa con T3/T5; ver `CONTEXT.md:296-298` Techo IA).
- Puente Factura Web (`servigas_integrations`, manual planilla puente — `CONTEXT.md:549`): ¿se audita el
  flujo manual o queda como nota? (gradúa con T3).
- Fiscal AR fuera del estándar: ¿alcance del ancla o se marca add-on tras Asesor fiscal? (gradúa con T3).
- Multi-sucursal / B2B / e-commerce en Servigas: ¿existen y entran, o se confirman como fuera?

## Out of scope

- Login Astro de usuario-tenant (empleado Servigas): **no existe** — `/login` autentica contra master,
  `/tenant/[slug]/app` es vista admin del tenant (gestionar módulos + chat IA) y `/hub/*` lee de master
  (`getBackend()`); Mostrador ni siquiera es hub. El operativo del tenant vive hoy en Odoo nativo
  (`modoops_servigas`). Si se quiere shell de empleado, es esfuerzo nuevo.

- Servigas original en `8069/5433` (este esfuerzo es tenant en ModoOps en `8070/5434`; el original vuelve
  solo si se redibuja el destino como esfuerzo nuevo).
- Rebuild/redeploy productivo, Vercel/Cloudflare, backups S3 / hot standby (solo instancia local).
- Merge de PRs abiertos y auto-creación de tenants desde el portal onboarding (carriles separados).
- Nuevo código en `mo.*` legacy (congelado — `CONTEXT.md:301`); todo lo nuevo nace en `modoops.*`.
