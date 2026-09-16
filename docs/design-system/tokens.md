# PROTOTYPE — Tokens vigentes + deltas (ticket 05)

Fuente vigente: `web/src/styles/global.css:3`. Prohibido agregar colores, fuentes o radios (`research/landing-2026/brief.md §5`).

## Vigentes (stylesheet manda)

| Token | Valor | Rol |
|---|---|---|
| `--color-space-void` | `#000000` | Hero, footer, fondo base |
| `--color-space-mist` | `#101020` | Alias `soft-linen`: bandas alternas oscuras (`Section.astro:13`) |
| `--color-galaxy-deep` | `#2a3444` | Alias `white`: secciones "claras" oscuras (`Section.astro:14`) |
| `--color-star-white` | `#f3ecf2` | Texto base, alias `canvas-white` |
| `--color-star-warm` | `#c05a42` | Único acento: CTA primario, **siempre con texto oscuro** (4.78 AA; en blanco falla) |
| `--color-star-glow` | `#b65e49` | Hover CTA |
| `--color-nebula-cyan` | `#496a95` | Alias `trust-slate`: bordes ghost-light, glass estático |
| `--font-sans` | Inter, system-ui | Única fuente |
| Escala tipo | display 48 / display-sm 40 / heading 32 / sub 24 / body-lg 18 / body 16 / body-sm 14 | `global.css:26` |
| `--spacing-section` 50px / `--spacing-element` 12px / `--width-content` 1120px | Ritmo + medida | Sin cambio |
| Radius pill 80px / cards 20px | Marca | Sin cambio; no agregar radio 16px Pinterest |

## Deltas propuestos (de briefs, a validar en spec final)

1. `letter-spacing: -1px` en display/display-sm + `text-wrap: balance` en titulares (landing brief §4).
2. `ash-gray` prohibido en texto CTA/cuerpo crítico (falla AA); solo bordes/notas `body-sm`.
3. Motion: `--motion-micro 100–150ms` / `small 150–250ms` / `medium 200–300ms` / `large 300–400ms`, `ease-out cubic-bezier(0.16,1,0.3,1)`, todo gateado por `prefers-reduced-motion: no-preference` (motion brief §12). Base ya respeta: `global.css:48` (scroll), `:focus-visible` global, `transition` con propiedades explícitas en `Button.astro:29`.
4. Sticky CTA bar móvil (único componente nuevo permitido).
5. Perf: hero <200KB, sin widget sobre fold, LCP <2.5s.

## Control Plane / Shell (sin tokens propios aún)

Herencia: monocromo + un acento por superficie, tablas full-width, color = estado (chip + texto, nunca solo color), numéricos tabulares a la derecha. Tokens desktop pendientes de prototipo 06 (pago) y spec final.
