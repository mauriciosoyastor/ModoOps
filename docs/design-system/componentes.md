# PROTOTYPE — Componentes: permitido / prohibido + antes/después (ticket 05)

## Button (`web/src/components/ui/Button.astro:1`)

- Permitido: `primary` (star-warm + texto oscuro) / `ghost-dark` / `ghost-light`; transiciones con propiedades explícitas (`Button.astro:29`); press `scale 0.97–0.98` 100–150ms; spinner→check al confirmar.
- Prohibido: `transition-all` (NEVER en `web/AGENTS.md`), bounce/pulse/shimmer, pills para metadata (pill 80px reservado a botones).
- Antes/después: `hover:opacity-90` genérico → transición explícita de `background-color` (ya está en `Button.astro:29`; mantener como ejemplo canónico).

## Section (`web/src/components/ui/Section.astro:1`)

- Permitido: `variant dark | linen | white` como banda full-bleed; `narrow` para formularios.
- Prohibido: cards sueltas en linen, cards anidadas, superficies claras nuevas.
- Drift documentado: `linen` y `white` hoy son oscuras (galaxia); no crear variante clara nueva sin decisión de spec.

## Tabla densa (Control Plane + Shell)

- Permitido: full-width table-first; numéricos `tabular-nums` derecha; filtros facetados como chips + clear-all + URL; row actions 1–2 visibles + overflow; destructivas con confirm; skeleton (no spinner); "showing X of Y"; empty vs sin-resultados.
- Prohibido: cards por fila, paginación sin estado en URL, color solo sin texto.

## Modal / Toast / Input

- Modal: fade overlay + `scale 0.96→1` (enter 200–300ms, exit 150–200ms); foco entra, trap, Esc, retorno al trigger.
- Toast: slide+fade, 4–5s (con acción: sticky o ≥10s), 1 a la vez, pausa en hover/focus, `aria-live`; nunca auto-dismiss <5s con acción.
- Input: label siempre visible, error fade+slide junto al campo + `aria`, anillo foco; 16px + `type/inputmode/autocomplete`; nunca bloquear pegado.
- Global: `prefers-reduced-motion: reduce → none` (snippet en motion brief §48-65).

## Pago desktop (puente a ticket 06)

Stepper fade/slide 250–400ms; skeleton solo mientras autoriza; check estático + copy clara; estados `idle / processing / success / error` (+`authorized` interno). Prohibido: countdown a presión, confetti, bounce en "Pagar", modal sin salida.
