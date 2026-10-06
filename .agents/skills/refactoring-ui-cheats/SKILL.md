---
name: refactoring-ui-cheats
description: >-
  Apply public Refactoring UI tactics (hierarchy via weight/colour, fewer
  borders, button hierarchy, accent borders, icon sizing, offset shadows on
  light surfaces) when a UI looks amateur or busy. Use for landing and app
  polish. Never copy Tailwind greys as brand; always respect ModoOps tokens and
  web/AGENTS.md. Do not reproduce paid book content.
---

# Refactoring UI cheats (public tactics)

Sources (public only — **do not** paste or reconstruct the paid book):

- [7 Practical Tips for Cheating at Design](https://medium.com/refactoring-ui/7-practical-tips-for-cheating-at-design-40c736799886) — Adam Wathan & Steve Schoger
- [Building Your Color Palette](https://refactoringui.com/previews/building-your-color-palette/) (free preview)
- Site: [refactoringui.com](https://refactoringui.com/)

**ModoOps hard overrides:**

1. Tokens and brand CSS already in the repo win over any Tailwind/gray recipe.
2. [`web/AGENTS.md`](../../../web/AGENTS.md) wins on focus, motion, ES-AR, CTA, contrast.
3. Landing dark-galaxia: **no** layered decorative shadows — use borders/spacing/background shifts instead (tip 3/4 adapted).
4. Never introduce Inter + indigo/violet defaults that make ModoOps look like generic AI SaaS.

## Steps

1. Name the problem: weak hierarchy, busy borders, unclear primary action, muddy colour, chunky icons.
2. Pick the matching tactics below; prefer the smallest change that fixes the scan path.
3. Implement with **existing** ModoOps tokens/utilities.
4. Done when hierarchy reads without relying on size alone and chrome is quieter than content.

## Tactics

### Hierarchy without size-only

- Emphasize with **weight** and **colour**, not only larger type.
- ~2–3 text colours: primary / secondary / ancillary (map to existing token roles, not new hex).
- ~2 font weights for UI (normal + semibold/bold). Avoid ultra-light weights for small UI text.

### Grey text on coloured backgrounds

- Don’t drop grey text on saturated fills.
- De-emphasize by reducing contrast against *that* background (e.g. white at lower opacity, or a same-hue quieter shade from the token scale).

### Shadows (light-app only)

- Prefer a slight **Y offset** over huge blur/spread when elevation is allowed.
- Skip on dark-galaxia landing; use `hobday-safe-rules` depth section instead.

### Fewer borders

Before adding a border, try in order:

1. Extra spacing between groups
2. Slightly different background tokens
3. A subtle elevation (light-app only)
4. Border as last resort

### Icons meant to be small

- Don’t scale 16–24px icon sets to hero size (they look chunky).
- Enclose small icons in a tinted shape, or use an icon set drawn for large sizes.

### Accent borders for bland regions

- A single brand-accent edge (alert rail, active nav, panel top) adds “designed” signal without illustration.
- Use ModoOps accent tokens (`star-warm` / flame roles / `--mo-accent`) — never a random Tailwind colour.

### Button hierarchy > semantic-only colour

- One **primary** solid action per view.
- **Secondary**: outline / quieter fill.
- **Tertiary**: link-like.
- Destructive red only when destruction is the primary action (e.g. confirm dialog); otherwise quieter treatment.

### Colour systems (preview principles)

- You need **scales** (greys + primary + semantic accents), not five generator swatches.
- Define shades up front; don’t `lighten()`/`darken()` ad hoc into 35 near-twins.
- Prefer extending existing `--mo-*` / stylesheet scales over inventing new ones ([color research](../../../docs/research/color-systems-mo-map-2026.md)).

## Anti-patterns

- Restyling the whole app to “look like Tailwind UI”.
- Adding cards, shadows, and borders all at once.
- Multiple solid primary buttons competing on one screen.
- English Title Case or `&` in copy (use ES-AR from `web/AGENTS.md`).

## Companion skills

- Dense app chrome: `hobday-app-visual`
- Safe visual defaults: `hobday-safe-rules`
- Guideline audit: `web-design-guidelines`
- Motion polish: Emil pack (don’t use this skill for animation curves)
