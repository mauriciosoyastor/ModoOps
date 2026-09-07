# Benchmark POS retail mostrador (2 cajas, 1 almacén) — 3-click checkout, atajos teclado, stock visible, fiscal AR

> **Ticket:** `.scratch/ui-ux/issues/02-benchmark-pos-retail.md` · **Fecha:** 2026-08-31 · **Scope:** Mostrador ModoOps (Odoo CE 19 `point_of_sale` + `pos_discount` + `stock` + `l10n_ar`/`l10n_ar_edi`) · **ICP:** 1 sucursal, 2 cajas, 1 almacén, ~5 usuarios, ~2 atributos producto
> **Referentes:** Odoo POS 19, Shopify POS v11.5 (Apr 2026), Square POS iOS 6.79+ (Nov 2025) · **Métrica destino:** Mostrador ≤3 clicks + NPS cualitativo (`ui-ux/map.md:3`)

---

## 1) Resumen ejecutivo

**El cuello del mostrador no es feature coverage, es coerencia operativa a 60–80 tickets/hora.** Los 3 referentes convergen en el mismo patrón: **buscar → tocar/agregar → cobrar** en 3 gestos, con teclado como acelerador, stock visible como prevención de "disculpe, no hay", y fiscal desacoplado del checkout rápido.

Para ModoOps (Odoo 19 CE, sin Enterprise, sin multi-sucursal en ancla) la oportunidad es **no replicar features, sino comprimir el path**:

| Principio | Qué copiamos | Qué NO hacemos (constraint Odoo 19) |
|-----------|--------------|-------------------------------------|
| **3-click checkout** | `Scan/Buscar (1) → Agregar (1) → Pago (1)` con variante "cliente opcional" post-pago | No tocamos `point_of_sale` core checkout flow; solo overlay JS (`mo_pos_*`) + `pos.config` (2 cajas) |
| **Keyboard-first** | `S` buscar, `Q/D/P` qty/discount/price, `N` pago, `C` cliente, `Esc` atrás — visible on-hold | No reinventamos hotkeys; extendemos los 33 nativos Odoo POS (mismo mental model que Shopify `Cmd+K/Enter/Esc` y Square `Cmd+F/S/1-5`) |
| **Stock visible en tile** | Cantidad live en cada tile + badge bajo-stock + bloqueo configurable en 0 | No bloqueamos venta por defecto en CE (es warning nativo); bloqueo solo con módulo `zehntech_pos_stock_info` (~$15) si el anexo lo exige |
| **Fiscal AR desacoplado** | Checkout no espera CAE; factura A/B/C/E se emite async vía `l10n_ar_edi` `wsfev1` + journal ARCA POS; `modoops.fiscal_enabled=False` hasta firma anexo | No prometemos comprobantes en ancla sin anexo fiscal cerrado (`CONTEXT.md:514`); no operamos ARCA POS por sucursal extra (1 sucursal = 1 ARCA POS number) |

**Gap actual ModoOps (ver `research/auditar-ui-actual/brief.md:4`):** Launcher → tile Mostrador → kanban `pos.config` → abrir sesión → productScreen = **≥4 clicks** a venta. Sin atajo directo a `productScreen` no se cumple ≤3. **Prototipo 05 debe resolver esto con deep-link + atajo teclado global.**

---

## 2) Metodología

- **Fuentes primarias:** docs Odoo 19 POS + AR fiscal (`odoo.com/documentation/19.0`), Shopify Help Center `keyboard-shortcuts` + Changelog 2026-04-27 + Retail Roundup 11.5, Square Community `Search and sell faster` (2025-11-05, 6.79+), Odoo Apps `pos_keyboard_shortcuts` / `zehntech_pos_stock_info` / `zehntech_product_low_stock_alert`, Odoo Forum `[l10n_ar] Flujo Facturación Electrónica desde POS` (Odoo 17+ feature), ARCA docs `wsfev1/wsbfev1/wsfexv1`.
- **Dimensiones benchmark:** (a) 3-click checkout path, (b) atajos teclado + modelo de interacción, (c) stock visible / low-stock / oversell prevention, (d) fiscal AR (comprobantes, journal, CAE).
- **Constraints ModoOps validadas:** `CONTEXT.md:174,359,514` (ICP 2 cajas/1 almacén, anexo fiscal cerrado pre go-live), `docs/catalogo-modoops-inicial.md:9-13` (Mostrador `point_of_sale+pos_discount`, Fiscal `l10n_ar` con guard), `research/auditar-ui-actual/brief.md:5` (Liquid Glass tokens `modoops_tokens.scss`, POS theme `modoops_pos.scss`).

---

## 3) Referente 1 — Odoo POS 19 (base de ModoOps)

**Checkout 3-click nativo (sin custom):**

```
Estado actual: productScreen (tiles) → numpad qty/discount/price → N (Payment) → seleccionar método → Validate → Ticket
Ideal 3-click mostrador: (1) S → type + Enter (buscar/agregar) → (2) tap producto / scanner Enter → (3) N → Enter (efectivo) = 3 gestos si cliente = Consumidor Final
Con cliente: + C → type + Enter (opt, antes de N) = 4 clicks; patrón aceptado: cobrar primero, asignar/emitir factura después (ver fiscal abajo)
```

- **Session model:** `pos.config` (hasta 2 en ancla) → `pos.session` abierta por caja; offline-first (IndexedDB), re-sync al online. 1 almacén = 1 `stock.warehouse` con ubicaciones `Recepción/Depósito/Mostrador` (Servigas validate 8.767 SKU). Variantes: hasta 2 atributos (ej. volumen+color) sin explosión SKU.
- **UX 19 observado:** overhaul visual "speed + touch responsiveness, minimize clicks during checkout" (`cybrosys slides new-ux-and-design-in-odoo-19-pos`). Reduce training time; aún sin métrica instrumentada (`auditar-ui-actual debt #2`).
- **Fiscal AR nativo (lo que Odoo 19 sí trae):** `l10n_ar` + `l10n_ar_edi` → journal Ventas con `Is ARCA POS?`, `ARCA POS System` (`wsfev1` factura electrónica A/B/C/M sin detalle, `wsbfev1` bono fiscal bienes capital, `wsfexv1` exportación E), `ARCA POS Number` + `ARCA POS Address` (1 por sucursal fiscal). Punto crítico: **ModoOps bloquea emisión con `ir.config_parameter modoops.fiscal_enabled=False` hasta firma anexo + validación asesor (`modoops_fiscal_guard.py`)** — staging puede avanzar sin fiscal, go-live bloqueado sin `Aceptación fiscal en staging`.
- **Flujo fiscal POS desde Odoo 17+ (foro gmz):** Facturar al vender a Consumidor Final / a contacto existente / crear contacto desde POS / facturar venta existente de otra sesión / reembolsos y NC. **No confundir ticket electrónico con factura electrónica.** Al cerrar pedido: click `Emitir factura` + seleccionar cliente (CUIT + responsabilidad AFIP/ARCA: RI/Mono/Exento/Consumidor Final → determina A/B/C). Requiere journal con `Use Documents` activo y `ARCA POS` correcto; CAE vía WSFE.

**Stock visible Odoo 19 CE:**

- **CE nativo:** Opción `Show available stock` en POS + warning si insuficiente — **no bloquea** venta en 0 (foro Odoo Online 19: "no built-in option to completely block sale when stock reaches zero"). Reordering rules en `stock` para reposición, sin badge en tile.
- **Módulos validados que cierran gap (sin desarrollo):**
  - `zehntech_pos_stock_info` ($14.93, Odoo 16-19, 1.994 LOC): live qty en cada tile, modo `on-hand` vs `available`, threshold low-stock, ocultar 0-stock, reportes PDF/CSV desde POS. **Recomendado para ModoOps Mostrador** (1 almacén, 2 cajas comparten stock).
  - `zehntech_product_low_stock_alert` (free): 3-tier thresholds (global → categoría → producto), recálculo real-time en cada movimiento, highlight en list/kanban + tag en POS, notificaciones multi-usuario. Complementa reporting de hub (`hub_inventory_data.xml` 21 cards).

**Keyboard shortcuts Odoo POS 19 — 33 nativos (fuente `tutorialtactic` 2025-10-27, cross-checked con Apps Store `eg_pos_keyboard_shortcuts`, `dp_pos_keyboard_shortcuts`):**

| Acción | Key | Acción | Key |
|--------|-----|--------|-----|
| Payment screen | `N` | Customer screen | `C` |
| Search product | `S` | Qty / Discount / Price (numpad mode) | `Q` / `D` / `P` |
| Add customer | `A` | Refund | `E` |
| Select Info | `F` | Delete line | `Backspace` |
| Up/down orderline | `↑`/`↓` | Left/right product | `←`/`→` |
| Print receipt | `R` | Invoice (`pos.order` invoice) | `I` |
| Back | `B` | Select user | `U` |
| Show orders | `O` | Close session | `M` |
| Alt+H hold (helper) | muestra overlay de hotkeys en POS | — | — |

Patterns clave para ModoOps: **`S` → type → `Enter` (agregar) es el loop de 80% del tiempo**; `Q` qty es segundo. Mantener defaults Odoo evita conflicto con `barcode scanner` / `number buffer`.

---

## 4) Referente 2 — Shopify POS v11.5 (Abr 2026)

**Checkout 3-click patrón (cart-centric, unified returns):**

- **Cart unificado:** returns/exchanges corren en el mismo cart (no flujo separado) — select return items + add exchange + refund decision en cart con search/scan/notes/customer. Permisos finos: `Manage item restock`, `Complete in-progress returns`, `Remove unfulfilled items` (+ `Require return reasons` opt).
- **Search suggestions + barcode scan** como primer click. Smart Grid tiles (acciones rápidas) — **no keyboard-navigable** (gap documentado), pero product/search/customer/orders sí.
- **Mid-session cash counts:** check drawer mid-shift sin cerrar sesión (útil 2 cajas ModoOps con handoff).

**Keyboard shortcuts (Changelog 2026-04-27, Help Center `keyboard-shortcuts`, blog Enovai 2026-06-15):**

- **Modelo mental:** `Focus → Move (arrows) → Confirm (Enter) → Back (Esc)`. `Cmd/Ctrl+K` abre search desde cualquier pantalla; `hold Cmd` muestra cheatsheet; `Cmd+1..9` jump a 1ºs 9 resultados; `Cmd+Enter` inicia checkout; `Tab/Shift+Tab` mueve focus entre regiones (search, product list, cart, customer, orders, checkout).
- **Por qué importa a 84 tx/h:** remove `tap fatigue` (tap → keyboard), reduce mis-taps, entrenamiento repetible, mejor ergonomía/accesibilidad. Validado field: cashiers a 80cm distance, doble tapping speed, split attention customer/transaction/interface.

**Stock visible:**

- Real-time tracking, low-stock alerts, multi-location sync (Shopify manage 1 warehouse well; Stocky agrega demand forecasting, transfers, suggestions). ModoOps no necesita forecasting en ancla — low-stock alert + transfer interna (Recepción→Depósito→Mostrador) alcanza.
- **Anti-patrón Benchmark 2026 (Interface Design `POS UX Benchmarking 2026`):** Square Sep 2025 forced UI rollout generó 2-3s product search delay — "most critical cashier-facing function when scanner fails". **Lección para ModoOps: no sacrificar search latency por theme glass; debounce + local IndexedDB debe ser <200ms.**

**Fiscal:** No comparable (fora AR). Shopify delega tax a `Avalara`/provincial; para ModoOps fiscal es local (`l10n_ar_edi`). Principio transferible: **no bloquear checkout por fiscal** (Shopify no bloquea payment por tax calc).

---

## 5) Referente 3 — Square POS iOS 6.79+ (Nov 2025) + Retail modes

**Checkout pattern:**

- **Search-first + hardware keyboard:** `Cmd+F` search items/customers/orders, `Cmd+S` save cart, `Cmd+1..5` navigate sections (Checkout/Inventory/etc), type price/qty + `Return` confirm. Favorites page para top-sellers (1-tap acceso). Quick Sale mode para items fuera de catálogo.
- **Offline payments:** cash + card offline (hasta $50k/txn, 72h expiry, no sign-out/delete/switch location con pendientes). No aplica directo a Odoo (Odoo POS ya es offline-first vía IndexedDB + sync), pero principio de **no perder venta por red** es compartido.

**Stock visible:**

- Square for Retail (Plus/Premium): real-time inventory, low-stock alerts, automated reordering, multi-location transfers, unit costs → COGS/margin, sell-through/aging reports. Free includes basic catalog. **Paridad con `zehntech_pos_stock_info` + `product_low_stock_alert` + native reordering rules.**

**Hardware:** Stand/Register/Terminal/Handheld/Reader — ModoOps ancla usa browser POS (cualquier tablet/PC + scanner USB/Bluetooth + impresora ticket opcional `receipt_printers`), no hardware lock-in.

**Benchmark critique (`POS UX Benchmarking 2026`):** Square's 3 UX overhauls in 18 months (Mar 2024 Restaurants, Jul 2025 POS+DASH, Oct 2025 AI voice/kiosk) improved aesthetics but forced rollout caused search latency — **feature velocity ≠ operational coherence.** Dimensiones de coherencia: (1) taxonomy alignment (find product when scanner fails), (2) learning curve, (3) error recovery self-resolving (no support ticket), (4) split-attention resilience.

---

## 6) Comparativa sintética — 4 dimensiones

| Dimensión | Odoo 19 POS (ModoOps base) | Shopify POS 11.5 | Square POS 6.79+ Retail | Implicación ModoOps |
|-----------|----------------------------|-----------------|--------------------------|---------------------|
| **3-click checkout** | `S→Enter → tap/scan → N→Enter`; cliente opt `C` post-pago | `Cmd+K→Enter → add → Cmd+Enter`; returns in-cart | `Cmd+F→Enter → qty+Return → pay`; Favorites 1-tap | **Adoptar Odoo native `S/N/C` + deep-link Mostrador (launcher 1-click→productScreen). Cliente no bloquea cobro; factura async.** |
| **Keyboard shortcuts** | 33 keys, `Alt+H` cheatsheet, screen-scoped (Product/Payment/Receipt/Global) | `Cmd+K`, `Cmd+1-9`, `Cmd+Enter`, `Esc`, `Tab`, `hold Cmd` cheatsheet; no Smart Grid kb nav | `Cmd+F`, `Cmd+S`, `Cmd+1-5`, type qty/price + Return | **Mantener Odoo defaults (`S/Q/D/P/N/C/E/B/↑↓←→`); añadir `hold Ctrl` overlay (como `pos_key_shortcuts` $20.50) y `Alt+H` help. No colisionar con scanner buffer.** |
| **Stock visible** | CE: show stock toggle + warning (no block). Gap cerrado con `zehntech_pos_stock_info` (live tile) + `zehntech_product_low_stock_alert` (3-tier) | Real-time + low-stock + Stocky forecast/transfers | Real-time + low-stock + auto-reorder + COGS | **Instalar `zehntech_pos_stock_info` + `zehntech_product_low_stock_alert` en ancla (≤$15). Mostrar on-hand en tile + badge rojo bajo mínimo global. No ocultar 0-stock por defecto (transparencia) salvo config.** |
| **Fiscal AR** | `l10n_ar` + `l10n_ar_edi` `wsfev1` + journal `ARCA POS number/address` + `Use Documents`; `modoops.fiscal_enabled` guard; CAE async | Tax externalizado | Tax US externalizado | **Fiscal no bloquea checkout: ticket POS inmediato, factura electrónica async vía `pos.order` → `account.move` + WSFE. Usar `wsfev1` estándar (A/B/C/M sin detalle) en ancla; `wsbfev1`/`wsfexv1` solo si anexo lista exportación/bienes capital. 1 sucursal = 1 ARCA POS.** |

---

## 7) Principios extraídos aplicables a Mostrador ModoOps (sin violar Odoo 19)

### 7.1 Checkout ≤3 clicks — principios

1. **Deep-link al productScreen, no al kanban.** Launcher tile Mostrador debe resolver `pos.config` default de la caja (2 configs en `point_of_sale.action_pos_config_kanban`) y abrir `/pos/ui?config_id=<id>` directo. **Métrica:** Login → productScreen = 2 clicks (login ya hecho) o 1 click launcher + `N` para pagar = 3 gestos venta simple. Hoy gap `auditar-ui-actual:5 #2` confirmado.
2. **Search es el click 1.** `S` focus search (como Shopify `Cmd+K`, Square `Cmd+F`) + type-ahead con categorías + recientes + favoritos (pinturería: top 20 SKU). Debounce <150ms, local IndexedDB, sin roundtrip. Scanner `Enter` = agregar directo (mismo input).
3. **Cliente es opcional en el flujo feliz.** Consumidor Final = 0 clicks extra. `C` solo si pide factura nominada (CUIT). Factura electrónica se emite **después** de `Validate` (no antes) — principio Odoo forum gmz: "no confundir ticket con factura; al cerrar pedido hacer click Emitir factura + seleccionar cliente".
4. **Descuentos sin modal.** `pos_discount` línea `%` (módulo ancla) + desc. general (4 cols numpad) — `D` cambia a modo descuento, type `10` + `Enter` aplica. No abrir popup por descuento manual (fricción).
5. **Validar stock no es validar checkout.** Warning inline si `qty > available` pero no bloquear por defecto; bloquear solo si `product` tiene `block_zero_stock=True` (config `zehntech_pos_stock_info`). Mensaje: `Stock: 2 disponible` en orderline.

### 7.2 Keyboard-first — principios

6. **Mantener vocabulario Odoo nativo.** `S` search, `Q` qty, `D` discount, `P` price, `N` payment, `C` customer, `Esc` back, `↑↓` orderline, `←→` productos, `Enter` confirm, `Backspace` delete. **No añadir `Ctrl` chords que colisionen con browser/scanner.** Shopify `Cmd+Enter` para checkout → mapear a `N`+`Enter` (ya es estándar Odoo).
7. **Cheatsheet on hold.** `Hold Ctrl` (o `Alt+H` per `dp_pos_keyboard_shortcuts`) muestra overlay 3D keycaps sobre botones product/payment. Reduce training de 2 días a <1h (Square/Shopify validado).
8. **Per-register bindings.** Cada `pos.config` (caja 1 / caja 2) puede tener mapping distinto (si add-on keyboard). Futuro: `pos_keyboard_shortcuts` config por caja; MVP: defaults globales.
9. **Visible focus ring.** `* :focus-visible { outline 3px solid var(--mo-flame-orange) }` sobre POS oscuro — required WCAG 2.4.7 + mitigación glass AA (`auditar-ui-actual debt #6`). No ocultar focus en orderlines.

### 7.3 Stock visible — principios

10. **Tile badge > modal.** Cantidad live en tile (esquina inf-der, tipografía `body-sm` 12px, fondo `rgba(0,0,0,0.6)` sobre imagen producto) + color semántico: verde >10, ámbar 1-10, rojo 0 o ≤ mínimo. `zehntech_pos_stock_info` ya resuelve; fallback CE: `qty_available` en `product.product` card (`hub_inventory`).
11. **Threshold 3-tier.** Global (ej. 5) → categoría (pintura 3, accesorios 10) → producto override. `zehntech_product_low_stock_alert` implementa sin código; reordering rules en `stock` disparan PO. **Hub Depósito Inteligente 21 cards ya muestra `Sin stock (warning)` / `Bajo stock (warning)` — corregir domain bug `qty_available <= 999999` (`auditar-ui-actual debt #3`) a `qty_available <= mo_stock_min_qty` o `product.category` threshold.**
12. **No ocultar 0-stock por defecto.** Mostrar tile desaturado + badge `Sin stock` pero tappable → diálogo `¿Vender igual? (reserva/transfer)` en vez de bloqueo silencioso. Solo ocultar si `pos.config` flag `hide_out_of_stock=True` (pinturería con 8.767 SKU puede querer filtrar).
13. **Transfer interna sin salir de POS.** Shortcut `Stock → Transfer` no existe en POS nativo; resolver vía hub: orderline long-press → `Ver en Depósito` deep-link a `stock.picking` (2 clicks hub). Futuro Fase 2: quick action `Transfer from Depósito` en POS.

### 7.4 Fiscal AR — principios (sin violar `CONTEXT.md:514` y `modoops_fiscal_guard.py`)

14. **Checkout ≠ facturación.** Ticket/POS receipt siempre (obligatorio retail). Factura electrónica A/B/C/E solo si cliente nominado + journal `Use Documents` + `ARCA POS` configurado + `modoops.fiscal_enabled=True`. **Desacople temporal:** validar pago en <2s; CAE WSFE en background (poll 3-5s). Mostrar `CAE pendiente` badge en `pos.order` → `account.move` hasta confirmar.
15. **Un journal, un ARCA POS por sucursal.** Ancla 1 sucursal → 1 `ARCA POS Number` + `ARCA POS Address` (domicilio fiscal). `wsfev1` cubre A/B/C/M sin detalle (retail mostrador). No configurar `wsbfev1`/`wsfexv1` sin anexo.
16. **Responsabilidad ARCA drive document type.** Cliente `l10n_ar_afip_responsibility_type_id` (RI → A, CF/Monotributo → B, Exento → C, Exterior → E) + `l10n_latam_identification_type_id` (CUIT/CUIL/DNI) + `l10n_ar_afip_pos_number` determina secuencia. Validar CUIT en `C` (customer screen) antes de `Emitir factura` — error inline, no modal backend.
17. **Reembolsos/NC desacoplados del flujo feliz.** `E` (refund) en POS existe pero **NC fiscal solo si anexo lista devoluciones** (`CONTEXT.md:514` excluidas por defecto). ModoOps: POS refund genera `pos.order` negativo; `account.move` NC solo si `l10n_ar_edi` + journal NC configurado. No prometer "nota de crédito en mostrador" en ancla sin anexo.
18. **Homologación antes de go-live.** Entorno fiscal prueba (certificados `wsaa`/`wsfe` homologación provistos por Cliente/asesor) → `Aceptación fiscal en staging`: emitir cada tipo comprobante del anexo + anular/NC si listado, sin usar producción como laboratorio (`CONTEXT.md:313`). Ventana coordinación 2 semanas hábiles post Hito1.

---

## 8) Lo que NO hacer — constraints Odoo 19 / ModoOps ancla

- **No instalar `l10n_ar_edi` sin guard.** Dep `l10n_ar` en `depends` ok, pero emisión bloqueada por `modoops.fiscal_enabled`. No custom `account.edi.format` sin ADR.
- **No multi-almacén / multi-sucursal UX.** 1 `stock.warehouse` hard constraint (`CONTEXT.md:376`). No diseño para transfers inter-sucursal ni stock por sucursal en POS.
- **No variantes ilimitadas.** Hasta 2 atributos (`docs/catalogo-modoops-inicial.md:10`); no matriz 100+ SKU en POS tile grid sin paginación.
- **No modificar `point_of_sale` checkout core.** Solo assets `modoops_pos.scss` + `mo_pos_theme.js` + `mo_pos_order_discount.js` + `mo_product_screen_order_discount.js` (whitelist `__manifest__.py:129`). Usar `pos_keyboard_shortcuts` / `zehntech_pos_stock_info` como módulos terceros validados, no fork core.
- **No prometer percepción/retención, multi-moneda, exportación en ancla.** Requieren Discovery + `l10n_ar_withholding` / `Fiscal fuera del estándar` add-on días×$52.
- **No glass sobre stock badge que rompa AA.** `mo-text-muted-dark 0.72` sobre `glass fill 0.08` falla WCAG (`auditar-ui-actual debt #6`); badge stock usa fondo opaco `rgba(...0.6)` + texto `canvas-white` 14px medium.

---

## 9) Recomendación para prototipo 05 (Mostrador ≤3 clicks)

**Prototipo 05 debe cerrar gap medido en `auditar-ui-actual:5`:**

```
Actual: Login (sg-login-page) → launcher tile Mostrador → kanban pos.config (elige caja) → Open Session → productScreen = 4-5 clicks
Objetivo: Login → launcher tile "Mostrador Caja 1" (deep-link config_id=1) → productScreen (autolog session) = 1 click
          + S type "latex 20" Enter → agrega → N Enter (efectivo) = 3 gestos core (sin cliente)
```

- **Launcher split:** tile `Mostrador` se desdobla en 2 tiles `Mostrador Caja 1` / `Caja 2` (o submenu) con `target pos productScreen` directo. Estado `pos.session` detecta sesión abierta → bypass kanban.
- **ProductScreen overlay:** search `S` fixed header + category pills + low-stock badge en tiles (verde/ámbar/rojo) + numpad `Q/D/P` pill (`modoops_pos.scss` command bar). Mantener Liquid Glass tokens (`$mo-flame-*`, `$mo-glass-blur 16px`, `radius-card 12px`) pero stock badge opaco.
- **Keyboard cheatsheet:** `Hold Ctrl` overlay (fase 2) o `?` hint fijo en bottom bar (MVP, sin add-on).
- **Fiscal async mock:** badge `CAE: pendiente | CAE 1234-00001234` en receiptScreen, sin bloquear Validate.
- **Medición:** evento `mo_pos_checkout_timed` en `mo_pos_theme.js` (start `S` → Validate) + `detect_changes` pre-commit para no romper `pos_discount` flow.

**Out of scope prototipo 05:** multi-sucursal, B2B cta cte, MRP, eCommerce, WSAA cert gestión (cliente), percepciones complejas.

---

## 10) Fuentes

- **Odoo 19 POS:** `odoo.com/documentation/19.0/applications/sales/point_of_sale.html` + `/point_of_sale/use/pos_invoices.html` + `keyboard_shortcuts.html` + Release Notes UX 19 POS (`cybrosys slides`).
- **Odoo POS shortcuts:** `tutorialtactic.com Odoo POS 33 shortcuts` (2025-10-27) + Odoo Apps `eg_pos_keyboard_shortcuts` (ALT helper), `dp_pos_keyboard_shortcuts` (per-register Alt bindings), `pos_key_shortcuts` (Ctrl overlay 3D keycaps), `sh_pos_all_in_one_retail` (quick shortcuts 19.0.11).
- **Stock Odoo:** forum `How to Restrict POS Sales When Stock is Zero — Odoo Online 19` (warning not block) + `zehntech_pos_stock_info` ($14.93, real-time tile, on-hand/available, threshold) + `zehntech_product_low_stock_alert` (free, 3-tier, POS tag) + `creyox pos_stock_management` (threshold confirm dialog).
- **Shopify POS:** `help.shopify.com/manual/sell-in-person/getting-started/keyboard-shortcuts` + `changelog 2026-04-27 Keyboard shortcuts and navigation` + `Retail Roundup 11.5 Apr 2026` (returns in-cart, search suggestions, mid-session cash counts, `hold Cmd` cheatsheet) + `enovaigroup Keyboard shortcuts 2026-06-15` (focus→move→confirm→back model).
- **Square POS:** `community.squareup.com Search and sell faster with connected keyboard` (2025-11-05, 6.79+, `Cmd+F/S/1-5`) + `squareup.com help offline-payments 2026-04-23` + `squareup.com inventory-management` (low-stock alerts, multi-location) + benchmark `interface-design.co.uk POS UX Benchmarking 2026` (coherence gap, 2-3s search latency post-forced rollout).
- **Fiscal AR:** `odoo.com/documentation/19.0/applications/finance/fiscal_localizations/argentina.html` (`l10n_ar`, `l10n_ar_edi`, `l10n_ar_reports`, `l10n_ar_withholding`, journals `Is ARCA POS?` `ARCA POS System wsfev1/wsbfev1/wsfexv1` `ARCA POS Number/Address`) + forum `[l10n_ar] Flujo Facturación Electrónica desde POS` (Odoo 17+ factura consumidor final/existente/nuevo contacto/existente sesión, refunds/NC) + `data-metrics.pro AFIP→ARCA 2024` + `trixocom odoo-argentina-trx-ce` + `CONTEXT.md:514` anexo fiscal + `docs/catalogo-modoops-inicial.md:13` guard `modoops.fiscal_enabled`.
- **Auditoría local:** `research/auditar-ui-actual/brief.md` §2-5 (launcher 9 tiles, hubs 5, POS assets, Liquid Glass tokens `modoops_tokens.scss:1`, navegación 3 clicks gap, debt list 10 items).

---

*Resuelto por subagente research/benchmark-pos-retail — base para `05-prototipo-mostrador-3clicks.md` (prototipo Figma/code) + `04-tokens-liquid-glass.md` (badge stock tokens) + `06-metricas-nps-tiempo.md` (instrumentar ≤3 clicks).*
