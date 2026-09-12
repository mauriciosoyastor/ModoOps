# Research — Herramientas gratis con IA para paleta + logo + UI (repos GitHub)

> **Ticket:** #146 (parte del mapa #144) · **Rama throwaway:** `research/herramientas-diseno-ia-146` · **Fecha:** 2026-09-12 · **Autor:** agente research (Muse Spark)
> **Pregunta:** relevar herramientas GRATUITAS con IA para diseñar sin formación, priorizando repos GitHub: generación/asistencia de paleta + logo/wordmark + UI/layout, y cómo se usan con Astro 5 + Tailwind v4 (tokens `@theme` en `web/src/styles/global.css`).
> **Contexto vigente:** dark-galaxia, CTA `star-warm` con texto oscuro obligatorio (4.78:1; en blanco falla AA), wordmark Inter con `translate="no"`, `web/AGENTS.md` manda sobre el gusto del modelo.

---

## 1. Resumen ejecutivo (TL;DR)

- **Para marca v1 (T-marca): NO usar un logo generado por IA como marca final.** El flujo recomendado es determinista y gratis: rampa validada por contraste con **adobe/leonardo** + **wordmark tipográfico Inter** (ya en uso, `translate="no"`) iterado en **Penpot** autohostado. IA solo para explorar ideas (ver §3, fila logocreator).
- **Para prototipo UI (T-prototipo): skill `web-design-guidelines` de `vercel-labs/agent-skills` como auditor + `shadcn-ui/ui` como base de componentes + Tailwind v4 `@theme` como sistema de tokens.** Todo gratis, todo con repo vivo verificado el 2026-09-12.
- **Paleta "IA generativa" pura (repos chicos tipo colormagic): no recomendada** — repos muertos o de 3★. El flujo que sí funciona: el agente LLM propone (armonías/OKLCH) y **Leonardo verifica contraste WCAG** antes de tocar `global.css`.

## 2. Verificación de repos (fuentes primarias, 2026-09-12)

| Repo | ★ | Último push | Licencia | Estado |
|------|---|-------------|----------|--------|
| `penpot/penpot` | 59.912 | 2026-09-11 | MPL-2.0 | ✅ vivo |
| `vercel-labs/agent-skills` (skill `web-design-guidelines`) | 31.123 | 2026-08-28 | MIT (según README; API devuelve `license: null`) | ✅ vivo |
| `tailwindlabs/tailwindcss` (v4 `@theme`) | 97.518 | 2026-09-08 | MIT | ✅ vivo |
| `shadcn-ui/ui` | 123.632 | 2026-09-12 | MIT | ✅ vivo |
| `adobe/leonardo` | 2.143 | 2026-07-08 | Apache-2.0 | ✅ vivo |
| `vercel/geist-font` | 3.620 | 2026-07-14 | OFL-1.1 | ✅ vivo |
| `Nutlope/logocreator` | 8.637 | 2026-08-03 | **sin licencia declarada** (`license: null` en API) | ⚠️ vivo pero sin licencia + requiere API key |
| `manicinc/logomaker` | 14 | 2025-06-11 | MIT | ⚠️ chico, sin IA |
| `FlowindAI/colormagic` | 3 | 2024-10-22 | sin licencia declarada | ❌ stale (~2 años), no usar |

Notas honestas:

- **`vercel/geist` no existe como repo** (la API devuelve "Could not resolve"). Lo verificable es `vercel/geist-font` (la fuente, OFL-1.1) + el lenguaje de diseño Geist vía la skill `web-design-guidelines`. No afirmar "repo Geist" a secas.
- **`vercel-labs/agent-skills` es colección de skills, no generador visual.** Su valor es la skill `web-design-guidelines` (100+ reglas: a11y, foco, forms, `prefers-reduced-motion`, dark mode, `Intl`, etc.) — verificada en el README del repo. Se alinea con `web/AGENTS.md` (que ya adapta esas guidelines a ES-AR).
- **Penpot no tiene IA generativa integrada.** Es plataforma de diseño open-source colaborativa (alternativa a Figma). La "IA" en el flujo Penpot la pone el agente que genera SVG/CSS y el humano que itera en el canvas.

## 3. Tabla comparada (pedida por el ticket)

| Herramienta | Repo | Costo real | Qué hace la IA | Qué NO hace | Output usable en Astro | Recomendada |
|---|---|---|---|---|---|---|
| `web-design-guidelines` (skill) | `vercel-labs/agent-skills` | Gratis (MIT). Costo de inferencia = el del agente que la ejecuta | Audita código UI contra 100+ reglas (a11y, foco, forms, animación, tipografía, dark mode, i18n) y guía al agente mientras genera | No dibuja nada; no genera paleta ni logo; no reemplaza criterio de marca | Directo: componentes `.astro`/Tailwind que ya cumplen `web/AGENTS.md` | **Sí — prototipo** |
| Tailwind CSS v4 `@theme` | `tailwindlabs/tailwindcss` | Gratis (MIT) | Nada por sí solo (es el sistema de tokens); la IA del agente lo edita con criterio | No propone paleta; no valida contraste | Nativo: `--color-*` en `global.css` → clases `bg-star-warm` etc. | **Sí — base de todo** |
| shadcn/ui | `shadcn-ui/ui` | Gratis (MIT, código en tu repo) | No es IA; es el catálogo de componentes que la IA puede instanciar bien | No resuelve marca/paleta; accesibilidad base correcta pero hay que auditar con la skill | Alta: portar patrones a Astro (no es drop-in; adaptar a `.astro` + tokens propios) | **Sí — prototipo** |
| adobe/leonardo | `adobe/leonardo` | Gratis (Apache-2.0) | No es generativa: **genera rampas a partir de un ratio de contraste objetivo** (determinista, algoritmo) | No inventa identidad; no da "la paleta linda", da la paleta que **pasa AA** | Directo: escala por pasos → volcar a `@theme` | **Sí — marca v1 (paleta)** |
| Penpot | `penpot/penpot` | Gratis (MPL-2.0; autohost gratis, cloud con tier gratis) | Sin IA integrada; su rol es canvas colaborativo + inspect CSS/SVG | No genera nada solo; curva de aprendizaje de herramienta de diseño | Exporta SVG/CSS que se pegan en Astro | **Sí — iteración visual marca v1** |
| Geist (fuente) | `vercel/geist-font` | Gratis (OFL-1.1) | Nada (es una fuente) | No es sistema de diseño completo en un repo | `@font-face` / Fontsource en Astro | **No cambiar** — ModoOps ya usa Inter como wordmark; Geist solo referencia |
| Nutlope/logocreator | `Nutlope/logocreator` | **No es gratis total**: gratis el código, pero genera con FLUX vía **Together AI con tu propia API key** (BYOK). Sin key no genera | Genera logos PNG (FLUX.2 pro) y edita (FLUX.1 Kontext); exporta brand kit | **Solo PNG** (el README lista "support SVG exports" como tarea futura); **sin licencia declarada** → riesgo legal para marca final; calidad tipográfica IA limitada | PNG para moodboard/exploración; **no como logo final en `web/src/assets`** | **Solo exploración** — sí para ideas, **no** para marca v1 final |
| manicinc/logomaker | `manicinc/logomaker` | Gratis (MIT), 100% cliente, cero dependencias | Nada (sin IA; generador paramétrico: ~400 fuentes, efectos, export) | No propone nada; calidad depende del operador | SVG/PNG directos, usables como wordmark draft | **Sí menor** — banco de pruebas tipográfico para wordmark |
| FlowindAI/colormagic y clones chicos | varios micro-repos | "Gratis" pero abandonados | Generación de paletas con OpenAI (requiere tu key) | Sin mantenimiento (push 2024-10, 3★), sin garantías de contraste | Hex sueltos | **No** |

## 4. Cómo se usa cada recomendada con Astro 5 + Tailwind v4 (ModoOps)

1. **Paleta (Leonardo → `@theme`).** Fijar fondo (`space-void #000000`) y pedir rampa con ratio ≥ 4.5 para texto. Volcar pasos a `--color-*` en `web/src/styles/global.css:4-39`. Regla dura vigente: **CTA `star-warm` solo con texto oscuro** (en blanco falla AA) — Leonardo lo confirma, no lo discute.
2. **Prototipo (skill + shadcn).** Instalar la skill (`npx skills add vercel-labs/agent-skills`), generar con el agente y auditar con `web-design-guidelines` antes de entregar. Patrones shadcn se portan a `.astro` usando los tokens existentes — **prohibido crear tokens que dupliquen la paleta** (`web/AGENTS.md` NEVER); el drift se reporta, no se esconde.
3. **Wordmark (Inter, `translate="no"`).** Iterar en Penpot o logomaker, exportar SVG a `web/src/assets`, mantener `translate="no"` y foco `:focus-visible` en el link del logo. No adoptar Geist sin decisión explícita (cambia identidad + carga de fuentes).
4. **Logo IA (solo exploración).** Si se prueba logocreator: `git clone https://github.com/Nutlope/logocreator`, `TOGETHER_API_KEY=...`, `pnpm install && pnpm dev`, generar, y usar el PNG **solo como referencia** para redibujar el SVG final a mano. No commitear outputs PNG de IA como marca.

## 5. Recomendación final

- **Marca v1 (T-marca): `adobe/leonardo` + wordmark Inter en Penpot.** Determinista, gratis, auditable por contraste, sin riesgo de licencia.
- **Prototipo (T-prototipo): skill `web-design-guidelines` + `shadcn-ui/ui` sobre Tailwind v4 `@theme`.** Es exactamente el stack que `web/AGENTS.md` ya presupone (decisiones #112, spec #114).
- **Qué no hacer:** adoptar paletas de micro-repos abandonados, usar PNG de FLUX como logo final, ni cambiar Inter→Geist sin ticket propio.
