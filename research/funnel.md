# Research — Patrones funnel landing medible y captura conversión a descubrimiento

> **Ticket:** #48 · **Mapa:** #46 · **Rama throwaway:** `research/funnel-patrones` · **Fecha:** 2026-08-31 · **Autor:** agente AFK research (Muse Spark)
> **Pregunta:** ¿Qué patrón de funnel landing medible convierte mejor visita → descubrimiento pago $155 USD en `web/src/data/business.ts` (solo precio público) + `web/src/pages/index.astro` + `docs/landing-architecture.md` + `docs/marketing-one-pager.md`? Investigar (1) dónde/cómo medir evento conversión y origen sin exponer Odoo; (2) qué stack mínimo (Astro SSR vs static+worker) sostiene métrica sin fricción y cómo conecta con kit Descubrimiento; (3) trade-offs privacidad/performance vs tooling y qué queda fuera MVP.
> **Repo:** `C:\Users\mauri\OneDrive\Desktop\ProyectosOpencode\ModoOps` · **HEAD:** `19e25f0`

---

## 1. Resumen ejecutivo (TL;DR)

| Decisión | Recomendación |
|----------|---------------|
| **Funnel MVP** | `visita → scroll → CTA click (#contacto) → contacto (WhatsApp/mail) → descubrimiento $155` — 4 eventos. Sin form en MVP. |
| **Dónde medir** | **Script <1KB client-side en `web/src/layouts/BaseLayout.astro:16`** (`data-analytics` + `plausible`/`umami` custom events) + **UTM en `web/src/data/business.ts:9` links**. Sin cookies, sin banner. |
| **Stack mínimo** | **Astro `output: 'server'` + `@astrojs/vercel` ya existe (`web/astro.config.mjs:7`) — mantener SSR Vercel**. No introducir Worker separado. Static+Worker es costo sin retorno (solo si se sale de Vercel). |
| **Analytics** | **Plausible Cloud €9/mo o Umami Cloud $9/mo self-host** — <1–2KB vs GA4 45KB. Vercel Web Analytics como complemento si se queda en Vercel (ya incluido, custom events `track()`). GA/pixel fuera MVP. |
| **Captura conversión** | `mailto:consultoria.matasini@gmail.com` + `https://wa.me/5493547532008` con **UTM + `?text=` pre-llenado** ya en `web/src/components/sections/Contact.astro:22` y `web/src/components/ui/FloatingWhatsApp.astro:6`; instrumentar `cta_whatsapp` / `cta_email` / `cta_discovery` events. |
| **Kit Descubrimiento** | Conversión = click outbound calificado. Registro manual en `docs/plantillas/descubrimiento-modoops-checklist.md:62` (Informe 9 + Propuesta 10). Sin backend Odoo hasta anticipo (`CONTEXT.md:66`). |
| **Seams testeables** | `web/src/data/business.ts:9` contrato contact + UTM builder (unit), `BaseLayout` script injection (e2e Playwright), analytics dashboard (manual). |

**No cerrar ticket:** requiere grilling en #52 (funnel comercial medible) + #49/#50.

---

## 2. Estado verificado — por qué hoy no hay funnel medible

### 2.1 Fuentes primarias

- `web/src/data/business.ts:9` — `contact.whatsapp = 'https://wa.me/5493547532008'`, `contact.email = 'consultoria.matasini@gmail.com'`, `publicPricing.discovery = '$155 USD'` (`web/src/data/business.ts:21`). **Solo descubrimiento es público** (`CONTEXT.md:37` "tras diagnóstico").
- `web/src/pages/index.astro:17` — ensambla 8 secciones `Hero → Problem → Solution → Path → Discovery → Audience → HowWeWork → Contact` dentro de `BaseLayout`.
- `web/src/components/sections/Hero.astro:23` — CTAs: `Button href="#contacto" variant="primary" "Pedir descubrimiento"` + WhatsApp + Email (ghost-dark). Sin `data-analytics` hoy.
- `web/src/components/sections/Contact.astro:18` — `mailto` con `?subject=Consulta ModoOps — Descubrimiento` + WhatsApp con `target="_blank"` (`Contact.astro:22`). También `FloatingWhatsApp.astro:6` fijo `bottom-6 right-6`.
- `web/src/layouts/BaseLayout.astro:16` — `<head>` con SEO/OG/Inter, sin script analytics, sin `partytown`.
- `web/astro.config.mjs:7` — `output: 'server'` + `adapter: vercel()` (`@astrojs/vercel@8.2.11` en `web/package.json:12`), `site: 'https://modo-ops-web.vercel.app'` (`astro.config.mjs:6`). **SSR activo por BFF IA** (`web/src/pages/api/modoops/[db]/agent/run.ts:1` `prerender=false`).
- `worker.js:1` — passthrough `env.ASSETS.fetch` — BFF ya migrado a Astro SSR (`worker.js:1` comentario).
- `docs/landing-architecture.md:3` — stack Astro 5 + Tailwind v4 + `PUBLIC_FORMSPREE_FORM_ID` pero `web/README.md:37` aclara "Sin Formspree en v1 — mailto+WhatsApp directo".
- `docs/marketing-one-pager.md:99` — contacto esperado: rubro, ciudad, cajas/usuarios, sistema actual, qué resolver.
- Deploy: `package.json:7` `"deploy": "vercel --prod"` + `package.json:6` `"build": "npm --prefix web install && npm --prefix web run build"` — Vercel, no Cloudflare Workers Builds.

### 2.2 Gap

Landing es **folleto estático sin telemetría**: no se mide visita calificada, ni qué CTA convierte, ni origen (UTM), ni funnel drop-off. Contacto es outbound puro (wa.me/mailto) — sin evento, sin origen, sin tasa `visita → contacto → descubrimiento`. Form `nombre/empresa/rubro/mensaje` (ticket #48) aún no existe; `Contact.astro:38` solo lista "Qué incluir en tu mensaje" como hint.

---

## 3. Patrones de medición — dónde y cómo medir

### 3.1 Eventos funnel (4+1)

| # | Evento | Cuándo | Dónde instrumentar | Nombre sugerido |
|---|--------|--------|--------------------|-----------------|
| 1 | **visita** | pageview `/` | `BaseLayout.astro:16` script auto (Plausible/Umami/Vercel) | `pageview` (auto) |
| 2 | **scroll 50%/90%** | usuario ve Discovery | `Discovery.astro:12` `IntersectionObserver` | `scroll_discovery` |
| 3 | **CTA click** | click `Pedir descubrimiento` | `Hero.astro:23` `#contacto` + `Discovery.astro` | `cta_discovery` |
| 4 | **contacto** | click outbound | `Contact.astro:18` + `FloatingWhatsApp.astro:6` + `Hero.astro:24` | `cta_whatsapp`, `cta_email` |
| 5 | **origen** | UTM/referrer en visita+contacto | `business.ts:9` URL builder + script `URLSearchParams` | props `utm_source`, `referrer` |

**Conversión calificada MVP = evento 4** (click WhatsApp/mail con props). No hay pago $155 en web — descubrimiento se cobra tras propuesta (`CONTEXT.md:66` $800 50/25/25 + `CONTEXT.md:28` crédito $77.5 si firma 20d). Métrica web = **tasa `cta_* / visita`**.

### 3.2 Cómo instrumentar sin Odoo (marca blanca `CONTEXT.md:50`)

**Opción A — Plausible custom events (recomendado):**

```astro
// web/src/layouts/BaseLayout.astro — dentro <head> tras SEO
<script defer data-domain="modoops.com.ar" src="https://plausible.io/js/script.tagged-events.js"></script>
<script>
  // en cada CTA:
  // plausible('cta_whatsapp', {props: {source: 'hero', utm: new URLSearchParams(location.search).get('utm_source')}})
</script>
```

- `script.tagged-events.js` habilita `plausible(event, {props})` sin cookies (`plausible.io/docs`).
- Plausible Astro integration: `npx astro add @plausible/astro` (`plausible({domain})` en `astro.config.mjs:5`) — oficial, <1KB.
- Dashboard:Funnels básicos (Plausible sí tiene funnel analysis, Umami también). Datos en EU, GDPR sin banner.

**Opción B — Umami (si se prefiere self-host / MIT vs AGPL):**

```html
<script defer src="https://umami.modoops.com.ar/script.js" data-website-id="..."></script>
<script>umami.track('cta_whatsapp', {source: 'floating', utm_source: '...'})</script>
```

- `~2KB`, Node+PG, 512MB RAM vs Plausible Elixir 1GB (2026 benchmarks). MIT license (`umami.is/compare/plausible`).
- Astro: `npm install @umami/astro` o tag manual en `BaseLayout.astro:16`.

**Opción C — Vercel Web Analytics (complemento, no reemplazo):**

- Ya en Vercel: `npm i @vercel/analytics` + `<Analytics />` en `BaseLayout`. Custom events: `import {track} from '@vercel/analytics'; track('cta_whatsapp', {source:'hero'})` (`vercel.com/docs/analytics/custom-events`).
- Pros: 0 config, mismo deploy, `track()` en SSR/edge. Contras: sin funnels/retención profundos, datos atados a Vercel, metered por eventos, no self-host. Útil como **segundo** si ya se paga Vercel Pro.

**Captura origen sin backend:**

```ts
// web/src/data/business.ts — añadir helper
export function whatsappWithUtm(source: string) {
  const utm = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).toString() : '';
  const text = encodeURIComponent(`Hola ModoOps — vengo de ${source} (${utm}) — rubro: __, ciudad: __, cajas: __`);
  return `${contact.whatsapp}?text=${text}`;
}
```

- `Contact.astro:22` ya tiene `rel="noopener"` — añadir `data-analytics="cta_whatsapp"` + handler que dispara evento antes de navegar (con `navigator.sendBeacon` fallback).
- UTM se propaga en `wa.me?text=` y en `mailto:?subject=&body=` — el operador lo ve en WhatsApp/email y lo vuelca manual al checklist (`docs/plantillas/descubrimiento-modoops-checklist.md:62`).

### 3.3 Form `nombre/empresa/rubro/mensaje` (cuándo sumarlo)

**Fase 1 (recomendado): NO form.** `web/README.md:37` acierta: mailto+WhatsApp tiene menos fricción que form para PYME con mostrador (ticket #48 pide medir, no necesariamente form). Formspree (`docs/landing-architecture.md:3` `PUBLIC_FORMSPREE_FORM_ID`) añade dependencia externa + spam + GDPR + mantenimiento.

**Fase 2 (si tasa `visita→cta` <2% o se pide trazabilidad):**
- `Contact.astro:10` añadir `<form>` con 4 campos (nombre, empresa, rubro select, mensaje textarea) → `POST` a `web/src/pages/api/contact.ts` (Astro SSR, `prerender=false` como `agent/run.ts:3`) que reenvía a `consultoria.matasini@gmail.com` vía Resend/SMTP o Formspree, y dispara `event: lead_form`.
- Validación: `required`, honeypot, rate-limit (`agent/run.ts:105` patrón `rateMap` 10/min), sin exponer Odoo.

---

## 4. Stack mínimo — SSR vs static+worker

| Dimensión | **SSR Vercel actual** (`astro.config.mjs:7` `output:'server'`) | Static + Worker (`output:'static'` + `worker.js:2` fetch) | Híbrido (`output:'hybrid'` + `prerender`) |
|-----------|---------------------------------------------------------------|-----------------------------------------------------------|-------------------------------------------|
| **Por qué existe hoy** | BFF IA `api/modoops/[db]/agent/run.ts:1` exige SSR (`prerender=false`). Landing `/` puede ser estática pero config es global. | Landing serviría como asset estático Cloudflare/Workers, Worker solo proxy `env.ASSETS`. | `/` estático (`prerender=true`), `/api/*` SSR (`prerender=false`) — óptimo perf. |
| **Funnel sin fricción** | Sí — analytics es client-side (`BaseLayout.astro:16`), no necesita SSR. SSR no penaliza TTFB si `/` se cachea `Cache-Control: s-maxage=10, stale-while-revalidate` (`vercel.com/docs/frameworks/frontend/astro` CDN Cache-Control). | Sí — mismo client-side; Worker no aporta. Static es más barato en Cloudflare pero hoy deploy es Vercel (`package.json:7` `vercel --prod`). | **Mejor TTFB**: `/` estático en edge, APIs SSR. Requiere `hybrid` + `vercel/static` vs `vercel/serverless` split. |
| **Conexión kit Descubrimiento** | Ninguna directa en MVP — conversión es outbound. Si form Fase 2, `api/contact.ts` SSR reusa `agent/run.ts:9` patrón `json()` + `rateMap`. | Form necesitaría Worker endpoint (`worker.js:3` hoy solo `ASSETS.fetch`) o Pages Function — reimplementar. | Igual que SSR para APIs. |
| **Costo/operación** | Vercel Hobby gratis + Plausible/Umami $9/mo o self-host. Sin infra extra. | Cloudflare Workers gratis pero migrar deploy + `check:deploy-contract` (`package.json:8`). | Requiere refinar `astro.config.mjs:5` adapter `vercel` options `edgeMiddleware`. |
| **Recomendación** | **Mantener SSR Vercel** — ya operable, BFF lo exige. No bloquear #52 por refactor a static. | Diferir hasta salir de Vercel o >10k visitas/mes. `worker.js:1` queda passthrough. | Evaluar en #52 si `index.astro` se marca `prerender=true` en `hybrid` tras medir. |

**Conclusión stack:** el funnel no justifica cambiar `output`. Analytics es `<script defer>` en `BaseLayout` — funciona idéntico en SSR/static/edge. El cuello es **evento**, no SSR.

---

## 5. Trade-offs privacidad / performance / tooling

| Tooling | Script | Cookies | Banner | GDPR | Funnel | Costo | Performance | Cuándo |
|---------|--------|---------|--------|------|--------|-------|-------------|--------|
| **Plausible** | <1KB | No | No | EU-host, GDPR por diseño | Sí (básico) | $9/mo 10k pv / self-host AGPL | Mejor (90× menor que GA) | **Recomendado default** — Astro integration oficial |
| **Umami** | ~2KB | No | No | No IP, GDPR sin banner | Sí | $9/mo 100k events / self-host MIT 512MB | Muy bueno | Si se quiere MIT + self-host Node stack |
| **Vercel Analytics** | ~2–3KB | No (anon) | No | Vercel DPA | No (solo custom events count) | Incluido Hobby/Pro metered | Bueno | Complemento si se queda en Vercel |
| **GA4** | 45KB | Sí | Sí | Requiere consent + config | Sí (complejo) | Gratis pero vende datos | Malo (LCP + banner) | **Fuera MVP** — ilegal sin config en EU, overkill folleto |
| **Meta Pixel** | ~30KB | Sí | Sí | Requiere consent | Sí | Gratis | Malo + bloqueadores | **Fuera MVP** — solo si campaña paga lo exige (#52) |

**Argumentos primarios:**
- Plausible `<1KB` vs GA4 `45KB` (`stackpicker.dev/guides/astro/analytics`, `withcabin.com/blog 2025`, `actionlabanalytics.com/compare/plausible-vs-umami`). Plausible no usa cookies/IP, EU-host, sin banner (`snorklee.com 2026` cookieless guide).
- Umami MIT vs Plausible AGPL, MySQL+PG vs PG-only, 512MB vs 1GB (`blog.canadianwebhosting.com 2026-03-11` Plausible vs Umami; `umami.is/compare/plausible`).
- Vercel Analytics: `custom events` vía `track()` + API `events/count`/`events/aggregate` (`vercel.com/docs/analytics/custom-events`, `vercel.com/docs/analytics/web-analytics-api 2026-06-26`), datos atados a Vercel, sin funnels profundos (`gautamkhorana.com 2026`).
- Astro minimal JS: analytics pesado anula beneficio Astro (`stackpicker.dev` "Adding a 45KB GA script defeats the purpose").
- Sin form, sin pixel, sin GA → 0 PII recolectado, 0 banner, 0 riesgo `CONTEXT.md:50` marca blanca (Odoo no expuesto).

**Qué queda fuera MVP (explícito #48):**
- B2B/multi-sucursal, CRM, eCommerce, MRP (`CONTEXT.md:375` excluidos) — no medir esos CTAs.
- GA4, Meta Pixel, TikTok Pixel — solo Plausible/Umami + opcional Vercel.
- Self-host Plausible/Umami en VPS propio — Fase 2 si >10k pv/mes o requisito soberanía datos.
- `Formspree` / `POST /api/contact` — diferir hasta evidencia de demanda.
- `partytown` / `astro:analytics` complejos — `defer` nativo basta para 1 script.

---

## 6. Seams a testear — contrato web

### 6.1 Unit (sin red, sin Odoo)

| Seam | Qué testea | Ejemplo |
|------|------------|---------|
| `business.ts:9` `contact` | `whatsapp` es `wa.me/549…` + `email` válido | `assert contact.whatsapp.includes('5493547532008')` |
| `business.ts` `whatsappWithUtm()` | UTM builder propaga `utm_source` en `?text=` | `whatsappWithUtm('hero','utm_source=ig') .includes('ig')` |
| `business.ts:21` `publicPricing` | Solo `$155` público, sin ancla | `assert !JSON.stringify(publicPricing).includes('800')` |
| `nav:3` `nav` | 3 anchors `camino/descubrimiento/contacto` | `assert nav.length===3` |

Ejecuta con `vitest` o `node --test` — sin Astro boot.

### 6.2 Integration / E2E (Playwright)

| Seam | Qué testea | Cómo |
|------|------------|------|
| `BaseLayout.astro:16` script injection | `<script data-domain>` presente, <1KB, `defer` | `page.locator('script[data-domain]').count()==1` |
| `Hero.astro:23` CTA → `#contacto` | Click dispara `plausible('cta_discovery')` antes de scroll | Mock `window.plausible` + `page.click` + assert call |
| `Contact.astro:22` + `FloatingWhatsApp.astro:6` | `cta_whatsapp` con `target _blank rel noopener` + utm | Click + `page.waitForEvent('popup')` + assert `track` |
| `Contact.astro:18` mailto | `cta_email` con `subject` pre-llenado | `href.includes('subject=Consulta')` + event |
| UTM passthrough | `?utm_source=ig` persiste en `wa.me?text=` | `goto('/?utm_source=ig')` → extract `href` → assert `ig` |
| Vercel `track()` (si habilitado) | `track('cta_whatsapp')` aparece en `vercel analytics` | Mock `@vercel/analytics` + assert |

**No testear:** dashboard Plausible/Umami (manual), envío real WhatsApp/mail.

### 6.3 Contrato deploy

- `npm run check:deploy-contract` (`package.json:8`) debe seguir verde si se añade script en `BaseLayout` (no rompe `astro.config.mjs:7`).
- `web/src/pages/index.astro:17` sigue prerenderizable aunque `output:'server'` (cacheable).

---

## 7. Recomendación operativa (para #52)

1. **Instrumentar hoy (30 min, 0 backend):**
   - Añadir `src/lib/analytics.ts` — `track(name, props)` wrapper que delega a `plausible`/`umami`/`vercel.track` + `sendBeacon` fallback.
   - `BaseLayout.astro:16` — inyectar Plausible `script.tagged-events.js` (o Umami) con `data-domain` del dominio final (`astro.config.mjs:6` `site`).
   - `Hero.astro:23`, `Contact.astro:18`, `FloatingWhatsApp.astro:6`, `Discovery.astro:12` — añadir `data-analytics` + `onclick="plausible('cta_…')"` con `source` prop.
   - `business.ts:9` — export `whatsappWithUtm(source)` que inyecta `?text=` con UTM + rubro hint.
2. **Medir 2–4 semanas:**
   - Dashboard Plausible: `visita`, `cta_discovery`, `cta_whatsapp`, `cta_email` por `utm_source`/`referrer`/`device`.
   - Meta: tasa `cta / visita` >3% y `scroll_discovery` >40% (benchmark folleto PYME).
3. **Conectar a kit Descubrimiento (`docs/plantillas/descubrimiento-modoops-checklist.md:62`):**
   - Cada lead (WhatsApp/mail) → crear fila manual `leads.csv` o `modoops_admin` tenant borrador con `origen`, `fecha contacto`, `rubro`.
   - En #50, checklist día 1 registra `origen` como campo obligatorio Informe 9.
4. **Decidir form en #52** solo si: `visita→cta` <2% o se pierde contexto (sin UTM en `wa.me?text`).
5. **Diferir:** GA4, Pixel, Formspree backend, static+worker, self-host — hasta validar 5–10 leads/mes.

Desbloquea #52 (funnel comercial medible) + alimenta #50 (kit) con origen trazable sin fricción ni PII.

---

## 8. Referencias primarias (claim → source)

- `web/src/data/business.ts:9` — `contact.whatsapp` `wa.me/5493547532008`
- `web/src/data/business.ts:21` — `publicPricing.discovery $155`, solo precio público
- `web/src/data/business.ts:121` — `nav` 3 anchors
- `web/src/pages/index.astro:17` — 8 secciones en `BaseLayout`
- `web/src/components/sections/Hero.astro:23` — CTA `Pedir descubrimiento` `#contacto`
- `web/src/components/sections/Contact.astro:18` — `mailto` con `subject`
- `web/src/components/sections/Contact.astro:22` — WhatsApp `target _blank`
- `web/src/components/sections/Contact.astro:38` — hint rubro/ciudad/cajas
- `web/src/components/ui/FloatingWhatsApp.astro:6` — WhatsApp flotante fijo
- `web/src/layouts/BaseLayout.astro:16` — `<head>` SEO sin analytics
- `web/src/components/sections/Discovery.astro:12` — `discovery.price $155`
- `web/astro.config.mjs:6` — `site` Vercel preview
- `web/astro.config.mjs:7` — `output:'server'` + `adapter: vercel()`
- `web/package.json:12` — `@astrojs/vercel 8.2.11`
- `web/package.json:7` — `deploy: vercel --prod`
- `package.json:6` — `build: npm --prefix web install && build`
- `worker.js:1` — passthrough `env.ASSETS.fetch`, BFF en Astro
- `web/src/pages/api/modoops/[db]/agent/run.ts:1` — `prerender false`, pattern `json()`+`rateMap`+`quota`
- `web/README.md:37` — sin Formspree v1, mailto+WhatsApp directo
- `docs/landing-architecture.md:3` — Astro 5 + Tailwind v4 + Formspree pendiente
- `docs/marketing-one-pager.md:99` — mensaje sugerido rubro/ciudad/cajas
- `docs/plantillas/descubrimiento-modoops-checklist.md:62` — Informe 9 + Propuesta 10
- `CONTEXT.md:28` — crédito $77.5 20d; `CONTEXT.md:37` — ancla tras diagnóstico; `CONTEXT.md:50` — marca blanca; `CONTEXT.md:66` — $800 50/25/25; `CONTEXT.md:375` — excluidos B2B/multi
- Tooling: `plausible.io/docs` (<1KB, GDPR, `script.tagged-events.js`), `umami.is/compare/plausible` (MIT vs AGPL, 2KB), `vercel.com/docs/analytics/custom-events` (`track()`), `vercel.com/docs/analytics/web-analytics-api` (events dataset), `stackpicker.dev/guides/astro/analytics` (Plausible oficial Astro), `blog.canadianwebhosting.com 2026-03-11` (512MB vs 1GB), `withcabin.com 2025` (GA 45KB), `snorklee.com 2026-07-23` (cookieless guide)
- Mapa #46 — plan-only, funnel medible fog, BFF 384d local

---

*Fin — dejar validación humana y grilling en #52 antes de implementar `analytics.ts` + `BaseLayout` script. Próximo: #52 funnel medible → #49 configurador → #50 kit.*
