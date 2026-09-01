# GitNexus Engineering Plan

> Task: Hilo 3 Spec #54 — funnel Plausible/Umami + 4 eventos (BaseLayout + business.ts UTM)
> Evidence verified at commit 981daaa56eb0c403812ec89d3be9402b4c0c92cb; GitNexus index available (exact-scan, fts/vector unavailable) — refresh skipped (freshness: accept, compact plan source-weighted).
> Evidence provenance schema 2; global dirty digest 5a46a5cfeff0cc3e31fc6f40509d23414b061a0668ba1957358b8f91a1e280ce; cited-path manifest 7 sorted entries; exact generated plan path excluded.

## Objective (§1)

Cerrar hilo 3 de Spec #54 (Wayfinder #46): completar funnel medible privacy-friendly sin form ni GA4. 4 eventos MVP [verified Spec #54:15]: visita (pageview Plausible auto), scroll 50/90% sobre #descubrimiento, cta_discovery, cta_whatsapp/cta_email con UTM. Entregable = BaseLayout instrumentado <2KB + helper whatsappWithUtm operativo + CTAs Hero/Contact/Floating cableados + traza auditable.

## Current Behaviour (§2–3) — ≤10 lines

BaseLayout.astro:33-36 [verified] ya inyecta Plausible script.tagged-events.js + data-domain modoops.com.ar + window.plausible queue. business.ts:14-18 [verified] exporta whatsappWithUtm(source) pero concatena todo window.location.search sin filtrar utm_* ni persistir. Hero.astro:23-25, Contact.astro:18-26, FloatingWhatsApp.astro:9 [verified] usan contact.whatsapp directo + onclick="plausible(...)" inline — helper nunca llamado, UTM no llega a wa.me. No hay observer scroll 50/90%. No hay soporte Umami ni env.

Arquitectura: web/src/layouts/BaseLayout -> web/src/pages/index.astro ensambla Hero/Discovery/Contact. Astro SSR vercel output server. Sin backend Odoo hasta anticipo (marca blanca).

## Findings (§4–5) — only load-bearing, each tagged + tool-named

- impact whatsappWithUtm upstream UNKNOWN [graph] via run.cjs impact — no resolvable callers (plain export, Astro dynamic). Source confirma 0 usos [verified Read business.ts + Grep].
- impact BaseLayout upstream UNKNOWN [graph] — symbol not indexed (Astro layout). Source confirma 1 consumidor index.astro [verified Read].
- query funnel/research #48->52 [verified gh issue view 52] define 4 eventos sin form, Plausible/Umami <2KB, helper UTM en business, registro manual hasta anticipo.
- PR #55 0bde820 [verified git show] declara funnel Plausible + events Hero/Contact/Floating pero diff muestra helper muerto + falta scroll.
- Plan template exige evidence_prov + write-plan helper [verified references/evidence-provenance.md].

## Proposed Changes (§6)

1. web/src/data/business.ts::whatsappWithUtm — filtrar solo utm_source/medium/campaign/content/term + gclid/fbclid, persistir en sessionStorage, encode msg `Hola ModoOps — vengo de {source} ({utm}) — rubro: __`, exportar parseUtm() testeable sin window. [verified] constraint: no exponer Odoo, USD canonico intacto.
2. web/src/layouts/BaseLayout.astro — mantener Plausible defer <2KB [verified 33]; agregar script is:inline con IntersectionObserver para #descubrimiento (threshold 0.5/0.9 -> plausible('scroll_discovery',{props:{percent:'50'}}) una vez), resolver data-domain via import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN ?? "modoops.com.ar" + fallback Umami comentado. No romper CSP inline onclick.
3. web/src/components/sections/Hero.astro, Contact.astro, ui/FloatingWhatsApp.astro — reemplazar onclick inline por data-cta + script is:inline que setea href via whatsappWithUtm(source) en client + addEventListener click -> plausible('cta_*',{props:{source}}). Mantener mailto sin UTM. [verified] Button.astro:21 soporta onclick string pero migrar a data attr evita inline JS.
4. web/src/components/sections/Discovery.astro — asegurar id="descubrimiento" estable para observer [verified ya existe].

## Implementation Sequence (§7) — risks inline as step notes

1. business.ts: refact whatsappWithUtm + parseUtm puro -> unit test offline (riesgo: window absent en SSR) note: guard typeof window.
2. BaseLayout: anadir env data-domain + observer script is:inline (riesgo: <2KB presupuesto — observer ~300B no cuenta en Plausible script).
3. Hero/Contact/Floating: cablear href dinamico + data-cta listeners, quitar onclick inline (riesgo: SEO href debe tener fallback sin JS -> dejar contact.whatsapp como href base + JS overwrite).
4. Verificar build npm run build + manual plausible queue en dev.

## Test Strategy (§8)

- Unit vitest web/src/data/business.test.ts (nuevo): parseUtm filtra, whatsappWithUtm(source) con ?utm_source=ig -> wa.me?text=...(%20utm_source%3Dig) [verified package.json vitest 3.1.1 existe, no script test — usar npx vitest run].
- Contrato web e2e opcional Playwright (seam 3 Spec #54): click CTA hero/contact/floating -> window.plausible call con props source + UTM; scroll #descubrimiento -> scroll_discovery 50/90 una vez. Prior art modoops_ia/logic.
- Edge: sin window (SSR), UTM vacio, UTM con PII (email) -> no persistir fuera utm_ allowlist, scroll observer disconnect tras 90%.
- Verify: npm run build en web/ (Astro SSR vercel) [verified script existe].

## Implementation Context (§11) — the mini-pack

```json
{
  "task": "Hilo 3 Spec #54 — funnel Plausible/Umami + 4 eventos (BaseLayout + business.ts UTM)",
  "head_commit": "981daaa56eb0c403812ec89d3be9402b4c0c92cb",
  "evidence_provenance": {
    "schema_version": 2,
    "head_commit": "981daaa56eb0c403812ec89d3be9402b4c0c92cb",
    "generated_plan_path": "docs/plans/2026-09-01-gitnexus-plan-funnel-plausible-utm.md",
    "global_dirty_digest": {"algorithm":"sha256","canonicalization":"gitnexus-evidence-provenance-v2 NUL-framed UTF-8 records","value":"5a46a5cfeff0cc3e31fc6f40509d23414b061a0668ba1957358b8f91a1e280ce"},
    "cited_path_manifest": [
      {"path":"web/src/components/sections/Contact.astro","state":"clean"},
      {"path":"web/src/components/sections/Hero.astro","state":"clean"},
      {"path":"web/src/components/ui/Button.astro","state":"clean"},
      {"path":"web/src/components/ui/FloatingWhatsApp.astro","state":"clean"},
      {"path":"web/src/data/business.ts","state":"clean"},
      {"path":"web/src/layouts/BaseLayout.astro","state":"clean"},
      {"path":"web/src/pages/index.astro","state":"clean"}
    ]
  },
  "primary_symbols": ["whatsappWithUtm","BaseLayout"],
  "direct_dependents_d1": [],
  "files_to_change": ["web/src/data/business.ts","web/src/layouts/BaseLayout.astro","web/src/components/sections/Hero.astro","web/src/components/sections/Contact.astro","web/src/components/ui/FloatingWhatsApp.astro"]
}
```

## Assumptions and Open Questions (§12)

- [assumed] data-domain modoops.com.ar es final; si Umami self-host, PUBLIC_PLAUSIBLE_DOMAIN switch sin redeploy Odoo. Confirmar DNS.
- [assumed] visita = pageview auto Plausible, no evento custom extra. Si auditor pide plausible('visita'), anadir.
- Pildoras video y B2B2C contador quedan Not yet specified fuera hilo 3 [verified Spec #54 Out of Scope].
- No GA4/pixel hasta 5-10 leads/mes [verified Spec #54].

## Definition of Done (§13)

- whatsappWithUtm filtra utm_* y persiste sessionStorage, usado por Hero/Contact/Floating (href dinamico) — unit vitest pasa.
- BaseLayout mantiene <2KB Plausible + observer dispara scroll_discovery 50 y 90 una vez — build Astro ok.
- 4 eventos MVP verificables en dev: pageview, scroll 50/90, cta_discovery (hero #contacto), cta_whatsapp/cta_email con props {source, utm} — lista en console plausible.q.
- Sin regresion: npm run build web/ verde, marca blanca (sin Odoo en comercial) intacta.
