# Wayfinder Map — Oficina Chat→3D→WhatsApp (configurador conversacional)

> Mapa local (tracker GitHub sin auth — se sigue precedente `wayfinder-portal-onboarding-3d.md:3` + `wayfinder-control-plane.md:3`).
> Estado: **cerrado 2026-09-09 — T1/T2/T3/T4/T5 cerrados, frontera vacía**. Spec publicada: `docs/specs/0011-chat-oficina-whatsapp-spec.md:1`. Handoff a `to-tickets`.

## Destination

Spec delta sobre `docs/specs/0010-portal-onboarding-3d-spec.md:1` + prototipo Astro `?variant=chat` donde el **Prospecto** responde un **chat con preguntas orientativas en lenguaje comerciante** sobre todo el **Catálogo ModoOps** (no solo ancla), la **oficina 3D se construye/marca en vivo en el panel de al lado** (bidireccional), y al terminar un **botón envía el borrador a WhatsApp comercial** para que el consultor presupueste en el **Descubrimiento pago**. Handoff a `to-spec`/`to-tickets` cuando el mapa cierre. Nada crea `modoops_<slug>`, nada muestra precio de ancla/add-ons.

## Notes

- Dominio: **Prospecto** (sin contrato, carga en portal) vs **Cliente** vs **Tenant** (`modoops_<slug>`) — `CONTEXT.md:44-49,243`. **Módulo ModoOps** (unidad comercial, ej Mostrador→`point_of_sale`) vs objeto 3D (su representación) — `CONTEXT.md:54`. **Catálogo ModoOps** = universo ofrecible, SSOT `modoops_catalogo/catalogo.json` (ADR 0009) — `CONTEXT.md:531`. **Configurador interno** (no self-service fase inicial) — `CONTEXT.md:62`; este portal es **pre-carga borrador**, validado en **Descubrimiento pago ($155)**.
- Decisiones fijadas en charting (Q1–Q5, 2026-09-09): Q1 destino recomendado sí; Q2 todo el catálogo en lenguaje comerciante (taller, pymes, etc); Q3 bidireccional chat↔3D; Q4 payload WhatsApp recomendado (texto legible + JSON v1, solo nombre+contacto requeridos); Q5 layout recomendado (split desktop, apilado mobile, fallback 2D, `prefers-reduced-motion`).
- Tech: `web/` Astro 5 + Tailwind v4; Three.js solo en `<script>` con import diferido (precedente `web/src/scripts/oficina-scene.ts:1`); seam único `web/src/lib/oficina-mapping.ts:1` (`OBJETO_A_MODULO`, `borradorV1`/`construirBorrador`, `validarBorrador`); consumidor `tools/configurador/logic/configurador.py:28` `generar` + wizard `modoops_configurador_wizard.py:42`.
- Marca blanca + pricing: portal nombra solo Módulos ModoOps (Odoo solo anexo técnico); web muestra solo Descubrimiento **$155 USD** — `CONTEXT.md:35-36`. Borrador siempre `vinculante: false`.
- Reglas UI: `web/AGENTS.md` — teclado operable, `<label>` + `aria-live`, NEVER `transition-all`, ES-AR voseo, `star-warm` CTA texto oscuro, estado en URL (`?variant=chat`), `Intl es-AR`.
- Skills por sesión: `grilling` + `domain-modeling` en grillings; `prototype` en prototipos; `research` en research (AFK).

## Decisions so far

- [Guion del chat en lenguaje comerciante](.scratch/oficina-chat-3d-whatsapp/issues/T1-guion-chat-comerciante.md): 3 bloques fijos (negocio→ancla→crecer, ~10 preguntas), rama única con ejemplos por vertical, mapping pregunta→key→objeto rehusando el seam.
- [Live-build 3D: rendimiento y patrones](.scratch/oficina-chat-3d-whatsapp/issues/T4-livebuild-rendimiento.md): rehusar `montarEscena` (lazy+IO, ResizeObserver, cleanup total), reservar layout contra CLS en T2, exponer `setResaltado/setConstruidos`; rama `research/oficina-chat-livebuild`.
- [Split chat/3D bidireccional](.scratch/oficina-chat-3d-whatsapp/issues/T2-split-chat-3d.md): prototipo `/prototype/oficina-chat` (split/stack) con guion en datos, `OficinaHandle.resaltar()` aditivo, borrador vivo, fallback teclado; sin verificar en browser (falta `three` en `web/node_modules`).
- [Contrato payload WhatsApp→Configurador](.scratch/oficina-chat-3d-whatsapp/issues/T3-payload-whatsapp.md): `wa.me/5493547532008` (URL 687 chars), gate `validarBorrador`, traducción a `generar` con hard gate fiscal esperado; ejemplo verificado con Python real 2026-09-09 (31/31 suites, e2e Taller El Cruce limpio con anexo).
- [Cierre comercial sin precio automático](.scratch/oficina-chat-3d-whatsapp/issues/T5-cierre-sin-precio.md): handoff en 3 pasos + archivo `negocio-fecha`, blindaje en 3 capas en criollo, Descubrimiento vs conteo, auto-confirmación "Recibí tu borrador" (glosario: nunca "presupuesto").

## Frontier (orden)

<!-- vacía 2026-09-09: T5 era el último ticket. El camino al destino está despejado: spec delta + `?variant=chat` con guion T1, split T2, payload T3 y cierre T5. Handoff a `to-spec`/`to-tickets`. -->

## Not yet specified

- Profundizar módulos de la sección crecer (taller, Excel, B2B, IA): preguntas de segundo nivel por add-on (acordado con humano 2026-09-09, esfuerzo posterior a este mapa o ticket nuevo si T2/T3 lo exigen).
- Anexo fiscal en chat: ¿hasta qué profundidad sin **Asesor fiscal del Cliente**? Cierre real sigue pre-go-live — `CONTEXT.md:210` (gradúa con T5).
- Migración catálogo (≤500): ¿el chat solo cuenta + detecta Excel o adjunta muestra? (gradúa con T1).
- Dónde vive el borrador además de `localStorage` (¿leads en `modoops_master`? ¿link mágico?) y autenticación del Prospecto (gradúa con T3).
- Métricas de conversión del chat (drop-off por pregunta) y traza prospecto↔borrador para Descubrimiento (gradúa con T2/T3).
- Liquid Glass v2 vs `DESIGN.md` sin glassmorphism: ¿el split chat/3D lo extiende o lo rompe? (gradúa con T2).

## Out of scope

- Auto-creación de Tenant `modoops_<slug>` desde el portal sin validación humana (pre-carga; crear DB es ejecución post-mapa).
- Self-service vinculante que reemplace Descubrimiento pago / Configurador interno en fase inicial (`CONTEXT.md:62`).
- Precio automático de ancla/add-ons en el portal o en el mensaje WhatsApp (solo Descubrimiento $155 es público — `CONTEXT.md:35-36`).
- Cierre del anexo fiscal en el portal (requiere validación del Asesor fiscal + firma; solo borrador).
- E-commerce, CRM, MRP, multi-sucursal, B2B avanzado dentro del ancla (`CONTEXT.md:377`).
- Migración adapter deploy del sitio (Vercel→Cloudflare); la escena es agnóstica.
- Cambiar Infra Multi-DB, Control Plane o requisito Grafo GitNexus.
