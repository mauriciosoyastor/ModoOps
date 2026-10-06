---
name: hobday-app-visual
description: >-
  Design dense product/application UI (gestor, hubs, light-app) with Anthony
  Hobday's application visual-design guidance: usability first, denotative
  colour, clear hierarchy, long-term visual comfort. Use when building or
  reviewing ops dashboards, tables, hubs, forms, or tool chrome — not marketing
  heroes. Defer to web/AGENTS.md and ModoOps tokens.
---

# Hobday — application visual design

Source: [Good application visual design](https://anthonyhobday.com/sideprojects/quickstart/applicationvisualdesign) (Anthony Hobday).

**Scope:** product/app surfaces (gestor, hubs, light-app, POS chrome). For marketing/landing heroes, prefer `hobday-safe-rules` + `web/AGENTS.md` + motion skills — not this skill’s density bias.

**ModoOps hard overrides:** tokens `--mo-*` / stylesheet SSOT; ES-AR voseo; WCAG AA; no parallel “pretty SaaS” palette.

## Steps

1. Confirm the surface is an **application**, not a landing section.
2. Apply the three pillars below in order: usability → layout hierarchy → long-term comfort.
3. Propose concrete CSS/component changes that increase clarity without adding decorative chrome.
4. Done when primary work is scannable, actions sit near their objects, and chrome stays quieter than content.

## 1. Usability first, beauty second

- Increase density when the job is “see lots of data at once” (tables, hubs, lists). Don’t pad ops UI like a brochure.
- Put actions near what they affect (or make the relationship visually obvious).
- Interactive elements must read as interactive without hover-only cues.
- Primary vs secondary vs tertiary actions must be obvious at a glance.
- Prefer **denotative** colour (colour = meaning in the UI: interactive, danger, ok) over **connotative** mood colour (blue = calm).

## 2. Clear layout hierarchy

- Structure readable in one glance: sections → sub-sections; clear where one region ends.
- Content beats chrome: toolbars/rails stay subordinate to data and tasks.
- Show nesting of controls: general controls outward; specific controls next to the thing they change.
- Use quiet dividers/layering to orient — not loud cards, glass, or stacked shadows.
- Hierarchical grid: split the shell into regions, then subdivide; avoid one flat soup of widgets.

## 3. Long-term visual comfort

- Prefer plain classical aesthetics over expressive “look at me” styling. Ops UIs are lived in for hours.
- Spend visual weight only where needed (alerts, primary CTA, critical metrics).
- Structural elements (dividers, rails) must not compete for attention.
- Type that works small (large x-height); remove paper cuts (misalignment, uneven gaps).
- Avoid eye-catching decoration that fatigues (gradients on every panel, animated chrome).

## Anti-patterns for ModoOps app UI

- Marketing hero patterns inside hubs (giant type, sparse whitespace, vibe gradients).
- Purple-on-white / AI-default card grids.
- Semantic-only buttons (every action solid-coloured) with no hierarchy — use `refactoring-ui-cheats` for action pyramids.
- New tokens that duplicate `--mo-*`.

## Companion skills

- Visual defaults: `hobday-safe-rules`
- Hierarchy tactics (public tips): `refactoring-ui-cheats`
- Interface audit: `web-design-guidelines` + [`web/AGENTS.md`](../../../web/AGENTS.md)
- Motion: Emil pack (`emil-design-eng`, `animate`, …) — keep motion short and purposeful in dense apps
