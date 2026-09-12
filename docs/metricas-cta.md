# Métricas por CTA — qué botón mide qué

> Fog item 5 (mapa #160). Fuente: `data-cta`/`data-source` en `web/src/` + Plausible (`BaseLayout.astro`). Ver en Plausible: eventos `cta_*` y `scroll_camino`, filtrar por prop `source`.

## Eventos

| Evento Plausible | Botón / link | `source` | Qué mide |
|---|---|---|---|
| `cta_propuesta` | Hero “Pedir propuesta” → `#contacto` | `hero` | Intención comercial principal |
| `cta_oficina` | Hero “Recorré tu oficina” → `/oficina` | `hero` | Entrada al portal desde hero |
| `cta_oficina` | Puente “Entrar a mi oficina” → `/oficina#camino` | `puente` | Entrada al portal desde puente |
| `cta_oficina` | Camino “recorré tu oficina virtual…” → `/oficina` | `camino` | Entrada al portal desde camino |
| `cta_whatsapp` | Hero / Contacto / flotante → `wa.me` (con UTM) | `hero` / `contact` / `floating` | Contacto por WhatsApp por ubicación |
| `cta_email` | Hero / Contacto → `mailto:` | `hero` / `contact` | Contacto por email por ubicación |
| `cta_login` | Hero + header “Trabajo en ModoOps” → `/login` | `hero` / `header` | Personal que entra al sistema (no es lead) |
| `cta_app` | Hero “Ir a mi panel” → `/app` | `hero` | Cliente existente (no es lead) |
| `scroll_camino` | Observer sobre `#camino` (50% / 90%, una vez) | prop `percent` | Profundidad de lectura |

## Reglas

- **Leads** = `cta_propuesta` + `cta_whatsapp` + `cta_email` (sources `hero`/`contact`/`floating`). `cta_login` y `cta_app` **no** son leads: excluirlos del funnel comercial.
- Todo link con `data-cta` **debe** tener su listener Plausible en el `<script>` del mismo componente (patrón Hero/Contact). Si agregás un CTA nuevo, agregalo también a esta tabla.
- WhatsApp lleva UTM vía `whatsappWithUtm(source)` (`business.ts`); el `href` base es fallback sin JS.
- Fuera de alcance: funnel del portal `/oficina` (copiar/enviar/cotizar) — se mide en el backend (`modoops.lead`), no en Plausible.

## Hueco conocido

`#descubrimiento` (sección $155) no tiene CTA propio: el scroll 50/90% sobre `#camino` es el proxy de interés. Si se agrega un botón ahí, cablearlo como `cta_propuesta` source `descubrimiento`.
