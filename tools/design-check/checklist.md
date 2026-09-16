# PROTOTYPE — Checklist tachable del agente (ticket 05)

> Una fila = capacidad × crafts. "Hecho" = todo tachado + `node tools/design-check/check.js` en verde + AA/perf medidos. El agente no marca hecho sin eso.

## Landing

- [ ] Hero: titular resultado + para quién + 1 CTA verb-first sobre fold (375px) — crafts: display 48 tracking -1px + balance, foco visible, sin widget sobre fold
- [ ] Problema/Solución/Camino: bandas full-bleed alternas, headings standalone — crafts: linen solo banda, sin cards anidadas
- [ ] Descubrimiento: precio $155 USD tabular + notas — crafts: USD sin mezclar, ash-gray solo notas
- [ ] Contacto: form ≤5 campos + labels + errores con foco/anuncio — crafts: inputs 16px, `Intl es-AR`, voseo
- [ ] Sticky CTA móvil + `SiteHeader` + `FloatingWhatsApp` — crafts: única motion nueva, targets ≥44px mobile
- [ ] Perf: hero <200KB, Inter `display:swap`, LCP <2.5s

## Control Plane

- [ ] Tabla tenants full-width table-first con columnas canónicas — crafts: numéricos derecha, chip+texto
- [ ] Row actions 1–2 + overflow, destructivas con confirm — crafts: foco visible, teclado, 44px
- [ ] Filtros facetados chips + clear-all + URL — crafts: reversibles, "showing X of Y"
- [ ] Veredicto mora arriba-izq — crafts: un veredicto por pantalla
- [ ] Logs: skeleton, empty vs sin-resultados — crafts: timestamp honesto

## Shell Tenant

- [ ] POS Full 2 col + receipt + denominaciones ARS + pay-exact — crafts: stock inline, atajos, foco en Cobrar
- [ ] Cobro QR desktop (ticket 06) con state machine — crafts: imposible éxito sin confirmación, timeout + reintento
- [ ] Tablas stock/compras/fiscal facetadas + bulk bar — crafts: skeleton, filtros reversibles
- [ ] Error AFIP como estado con causa + reintento — crafts: color nunca solo

## Transversales (toda superficie)

- [ ] `check.js` verde (cero prohibidos)
- [ ] Cero `transition-all`, focos visibles, `prefers-reduced-motion` respetado
- [ ] Copy ES-AR voseo, marca `ModoOps` con `translate="no"`, sin Odoo en marketing
- [ ] Contraste AA medido en textos críticos (fog: criterios medibles → spec final)
