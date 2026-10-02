---
name: hobday-safe-rules
description: >-
  Apply Anthony Hobday's safe visual-design defaults (near-black/white, spacing
  scales, nested corners, no shadows in dark UI, deliberate alignment). Use when
  polishing UI, fixing a design that looks "off", reviewing visual coherence, or
  choosing safe defaults for landing or app surfaces. Always defer to
  web/AGENTS.md and ModoOps tokens when they conflict.
---

# Hobday safe visual rules

Source: [Visual design rules you can safely follow](https://anthonyhobday.com/sideprojects/saferules/) (Anthony Hobday). Safe defaults, not laws — break them only with a reason.

**ModoOps hard overrides (always win):**

- Obey [`web/AGENTS.md`](../../../web/AGENTS.md) (focus, motion, ES-AR, CTA `--mo-accent`, WCAG AA).
- Use existing brand/token CSS (`--mo-*`). Never invent a parallel palette.
- Landing en Tema papel: prefer crisp borders over shadows.

## Steps

1. Identify the surface: **landing** (Tema papel, mismos tokens `--mo-*`) vs **app** (light-app / gestor).
2. Walk the checklist below against the UI or proposed change.
3. Report findings as `file:line — rule — fix` (or a Before/After table if reviewing).
4. Apply only changes that keep ModoOps tokens and copy rules intact.

## Checklist (safe every time)

### Colour and contrast

- Near-black / near-white instead of pure `#000` / `#fff`.
- Saturate neutrals slightly toward the brand hue (keep warm *or* cool, not both).
- High contrast for important elements; structural chrome stays quiet.
- Palette colours need distinct brightness values, not just distinct hues.
- Container borders contrast with **both** the container and the page background.
- Dark UI container vs background brightness delta ≈ within ~12% HSB; light UI ≈ within ~7%.

### Type

- Body text ≥ 16px (or equivalent).
- Line length around ~70 characters.
- Larger text → tighter tracking/leading; smaller text → looser.
- At most two typefaces; prefer faces that hold up at small sizes (large x-height).

### Spacing and alignment

- Measurements from a related scale (e.g. multiples of 4/8); avoid one-off px.
- Everything aligns with something else; prefer optical alignment when math looks wrong.
- Outer padding ≥ inner padding inside containers.
- Spacing measured between points of **high contrast**, not arbitrary boxes.
- Nested corner radii: inner = outer − gap (concentric).
- Don’t put two hard divides next to each other (border + background shift + hairline).

### Depth

- Don’t use shadows in dark interfaces. On the landing, use borders and layers.
- Don’t mix depth techniques (soft shadow + hard shadow + outline randomly).
- If a light-app shadow is allowed: blur ≈ 2× distance; closer layers lighter.
- Simple on complex or complex on simple — never complex on complex.

### Controls

- Button horizontal padding ≈ 2× vertical padding.
- Icons paired with text: lower icon contrast so type leads.
- Order sibling actions by visual weight (heaviest toward the outer edge).

### Deliberation

- Every whitespace, size, colour, and shadow choice should be explainable. If it can’t, remove or systemize it.

## Completion

Done when each violated rule has a concrete fix that still passes `web/AGENTS.md` and uses ModoOps tokens.
