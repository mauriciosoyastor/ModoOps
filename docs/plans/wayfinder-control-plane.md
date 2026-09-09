# Wayfinder Map — Control Plane: instancia + Acceso Captación + botón Video-IA

> Mapa local (el tracker GitHub quedó descartado por decisión del humano).
> Estado: **charted 2026-09-05**. Charting no resuelve tickets; cada ticket = 1 sesión.

## Destination

El Control Plane Astro expone tres cosas verificadas contra el Odoo de Docker
(`modoops_master` en `localhost:8070`):

1. Una sola instancia web local acoplada (puerto y env canónicos).
2. Un **Acceso Captación** separado del admin para conseguir leads.
3. Botón de ingreso al generador de videos comerciales (Video-IA S1).

Handoff a `to-tickets` cuando el mapa cierre.

## Notes

- Dominio: Captación propia (`Lead`, glosario #90); Control Plane (`/admin/*`, middleware protege `/admin` y `/api/admin`); Video-IA S1 (`GET /api/admin/tenants/video-access`, master-only, link externo `_blank`, falla cerrada 401/503).
- Skills por sesión: `grilling` + `domain-modeling` en grillings; `prototype` en prototipos; `tdd` si un task toca código.
- Término fijado: **Acceso Captación** = puerta/rol aparte solo para captar; distinto de `Leads` (gestionar, admin) y de `Importar CSV` (alta masiva).
- Hechos verificados en triage: dos dev-servers (:3001 humano, :4321 agente); única alta de leads = CSV (`Lead.create` en wizard, lista `create=0`, Astro sin create); cero botones video en UI; `modoops_lead` vacía en Docker (tabla renderiza "0 leads"); login Odoo `admin` existe.

## Decisions so far

- **T1 — acoplar la instancia (cerrado 2026-09-05):** puerto canónico `:3001` (ya fijado en `astro.config.mjs`); se corre con `compose up` (servicio web nuevo), manual solo para debug; servicio web en modo dev con bind-mount (sin rebuild, como Odoo); `ODOO_URL=http://odoo:8069` interna (red compose); envs vía `env_file: web/.env` + override. Consecuencia: el dev-server manual deja de ser el camino habitual.
- **T2 — diseño Acceso Captación (cerrado 2026-09-05):** puerta aparte `/captacion` con sesión Odoo normal, sin rol nuevo; captador ve intake manual + lista con filtros, sin Baja ni Purgar; intake = nombre (requerido) + teléfono + email + categoría con aviso S4; alta audita en `tenant.log` sin PII (como CSV); lista = todos los leads (sin campo dueño).
- **T4 — seed leads demo (cerrado 2026-09-05):** 3 leads `fuente=demo` en `modoops_master` (nuevo con teléfono, descartado S4 sin teléfono, contactado). Reversible: Baja por fila o Purgar. Vía SQL directa (sin auditoría ORM — solo demo).
- **T5 — URL video en dev (cerrado 2026-09-05):** mock `https://video.stub/nuevo` (mismo stub de los tests; docs no definen generador real). Configurar en `web/.env` como `VIDEO_ACCESS_URL=` (hoy ausente → 503 cerrado por diseño). Contrato: sin sesión 401, con sesión sin env 503, con todo 200 `{link-externo, _blank}`.
- **T3 — botón Video-IA (cerrado 2026-09-05):** variante **header** (botón 🎬 Video IA en `/admin/leads`, con estado visible; prototipo banner/fab descartado). Investigación URL real: no existe generador propio — MoneyPrinterTurbo es self-host (WebUI :8501, API :8080, requiere deploy + API keys LLM/Pexels/TTS); Remotion es render programático, no un link. Decisión: queda el stub hasta desplegar Turbo (nuevo esfuerzo). Verificado por humano: click → 200 → abre pestaña (NXDOMAIN esperado del stub).

## Frontier (orden)

### T1 — grilling — ¿Qué es acoplar la instancia? (HITL, sin bloqueos)

Decidir: puerto único (:4321 vs :3001), `.env` canónico (`PUBLIC_SITE_URL`, `ODOO_URL`, `ODOO_DB`),
quién corre qué (dev-server humano vs agente), y si el stack suma servicio web a `compose.yml`
(hoy solo db/odoo/ollama). Responde y deja Owner + puertos escritos.

### T2 — grilling — Diseño del Acceso Captación (HITL, sin bloqueos)

Decidir: ¿rol Odoo nuevo o ruta con auth propia? ¿Qué ve un captador (solo intake + sus leads)?
¿Intake manual + CSV o solo manual? ¿Audita en `tenant.log` como el wizard? Responde con el
contrato de acceso (quién/qué ve/qué crea).

### T3 — prototype — Botón Video-IA (HITL, bloqueado por T5)

Con la URL de T5, prototipo del botón en panel master: placement, estados
401/503/200 (link `_blank`, decisiones #83–#85), y qué ve el usuario sin env configurado.
Asset: diff o captura enlazada. Bloqueado por: T5.

### T4 — task — Sembrar leads demo (AFK, sin bloqueos)

2–3 leads demo en Docker (`modoops_master`) para verificación visual de T2/T3
(tabla, filtros, Baja, Purgar). Responde con conteo y cómo revertirlo (Purgar).

### T5 — research — URL del generador en dev (AFK, sin bloqueos, en paralelo)

¿Qué valor usa `VIDEO_ACCESS_URL` en dev (mock o real)? ¿Dónde se configura
(`web/.env`, Vercel, otro)? Responde con valor + ubicación. Desbloquea a T3.

## Not yet specified

- ¿Import CSV también en Astro o queda solo en Odoo? (gradúa con el build del Acceso Captación).
- ¿El botón video va también al backend Odoo o solo Astro? (gradúa con T3).
- Campo dueño en lead ("mis leads") — diferido por T2; vuelve si se pide.

## Out of scope

- Merge de PRs #103/#104/#105 (va por carril de merge humano, no de este mapa).
- Rebuild/redeploy productivo o Vercel (solo instancia local en este esfuerzo).
- Nuevo modelo Odoo para captadores salvo que T2 lo exija (si lo exige, se re-abre).
