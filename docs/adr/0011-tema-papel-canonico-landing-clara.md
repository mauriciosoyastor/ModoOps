# ADR 0011 — Tema papel canónico; landing = Superficie marketing clara

La cara pública de ModoOps deja **dark-galaxia** y adopta el **Tema papel** del light-app (ya default en shell/Control Plane): mismas capas, tipografía, radios, roles semánticos y atmósfera; **sin** chrome denso ni densidad ops de gestor. El **Acento ModoOps** es `--mo-accent` de `papel` (no `star-warm`). Variantes `warm`/`denso` quedan internas de **Superficie producto**. Entrega: prototipo `landing-papel` → migrar superficies públicas Astro; luego alinear `web/AGENTS.md` y retirar galaxia de prod marketing.

## Considered Options

- **Acento:** A) terracotta galaxia (`star-warm`) vs B) jade `papel` vs C) capas papel + CTA warm. Elegimos **B** para una sola marca entre marketing y producto; el default producto ya es `papel`.
- **Profundidad:** A) solo accent vs B) accent+tipo+radios+roles+atmósfera vs C) clonar chrome gestor. Elegimos **B**; C degrada la landing a brochure-dashboard.
- **Galería dark:** A) abandonar galaxia en marketing vs B) mapear tokens sobre void vs C) hero dark + body light. Elegimos **A** (corte limpio; prototipo antes de `/`).

## Consequences

- `CONTEXT.md`: glosario **Tema papel**, **Superficie marketing/producto**, **Acento ModoOps**.
- Próximo: `/prototype` landing-papel; override de MUST `star-warm` en `web/AGENTS.md` al promover a prod; `docs/DESIGN.md` (Neuralink) a reescribir o marcar legado.
