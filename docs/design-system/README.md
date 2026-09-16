# PROTOTYPE — Sistema de diseño ModoOps (throwaway, ticket 05)

> Artefacto barato para reaccionar, no spec final. Si se valida, se pliega al código real y se captura en branch throwaway con puntero en el ticket. Ver ticket `.scratch/sistema-diseno-modoops/issues/05-prototipo-checklist-spec.md`.

## Orden de autoridad (detectado contra código, 2026-09-15)

1. `web/src/styles/global.css` — tokens vigentes (dark-galaxia; los alias mandan).
2. `web/AGENTS.md` — reglas de interfaz para agentes (MUST/SHOULD/NEVER).
3. `docs/DESIGN.md` — intención original landing (clara). Donde contradice al stylesheet, **manda el stylesheet** y se reporta drift, no se esconde.
4. Doctrina `https://vercel.com/design.md` — restraint ("pulir"): jerarquía tipo primero, quietud por defecto.
5. Briefs `research/{landing-2026,desktop-gestion-2026,motion-componentes}/brief.md` — referencias 2026.

## Contradicción abierta (domain-modeling: el código manda)

`docs/DESIGN.md` dice landing clara (`soft-linen #f5f5f5`, `canvas-white #ffffff`, acento `trust-slate`); el código implementó dark-galaxia (`Section.astro:11` — `linen → bg-space-mist #101020`, `white → bg-galaxy-deep #2a3444`; `Button.astro:17` — primary `star-warm` fondo con texto oscuro). `web/AGENTS.md` lo blanquea: "tokens del stylesheet mandan". El prototipo documenta lo vigente, no lo deseado. Decidir en spec final si se blanquea DESIGN.md o se revierte el tema.

## Cómo lo usa el agente (checklist)

1. Lee `superficies.md` para su superficie (Landing / Control Plane / Shell).
2. Implementa capacidades tachando `tools/design-check/checklist.md` (una fila = capacidad × crafts).
3. Corre `node tools/design-check/check.js` — fail-closed en prohibidos; en verde + AA/perf medidos = "hecho".
4. Lo no tachable (copy PYME, criterios AA medibles) sigue en fog del mapa hasta la spec 05 final.

## Archivos

- `tokens.md` — tokens vigentes por superficie + deltas propuestos (sin nuevos colores/fuentes/radios).
- `componentes.md` — Button/Section/tabla/modal/toast/pago: permitido/prohibido + antes/después.
- `superficies.md` — capacidades × crafts por superficie (de ticket 04).
