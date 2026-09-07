# Audit UI actual — ModoOps Gestor hubs

> Ticket: `.scratch/ui-ux/issues/01-auditar-ui-actual.md` · Fecha: 2026-08-30 · Scope: `modoops_core` views + hubs + launcher + tokens + navegación

## 1) Verificación local

- `http://localhost:8070/web/login` → **200 OK** (curl 2026-08-30). Título `modoops`, `is_public: true`, bundle `web.assets_frontend.min.css` cargado. Login layout `sg-login-page` oscuro activo.
- `http://localhost:8070` / POS index título override: `Mostrador modoops` (`views/login_templates.xml:11`).

> Screenshots no automatizados (login requiere sesión). Captura manual pendiente: `/web/login`, launcher post-login, cada hub (Resumen + 1 sección), POS productScreen. Recomendación: Playwright con sesión `admin` → `research/auditar-ui-actual/screenshots/`.

## 2) Inventario de pantallas

### 2.1 Launcher (post-login home)

- **Componente:** `static/src/js/launcher/app_launcher.js` + `mo_launcher_shell.js` + `mo_launcher_tile.js` · SCSS `modoops_launcher.scss:1` · Action `ir.actions.client` tag `modoops_app_launcher` (`views/launcher_menus.xml:3`).
- **Tiles (`data/launcher_tiles_data.xml:4`):** 9 tiles data `mo.app.tile` (noupdate + override):

| # | label | hint | icon | accent_key | target | metric |
|---|-------|------|------|------------|--------|--------|
|10| Ventas | Pedidos y cotizaciones | fa-line-chart | flame-yellow | hub `modoops_sales_hub` | sale.order count sale/done |
|15| Clientes | Agenda de clientes | fa-users | flame-yellow | action `account.res_partner_action_customer` | res.partner customer_rank>0 |
|20| Stock | Productos, stock y operaciones | fa-cubes | flame-orange | hub `modoops_inventory_hub` | product.product active |
|30| Compras | Pedidos y proveedores | fa-shopping-cart | flame-deep | hub `modoops_purchase_hub` | purchase.order draft/sent/to approve |
|40| Cobros | Facturas, pagos y cobros | fa-file-text-o | flame-rust | hub `modoops_accounting_hub` | account.move draft out/in |
|45| Taller | Órdenes de trabajo y artefactos | fa-wrench | ember-amber | hub `modoops_workshop_hub` | mo.work.order draft |
|50| Mostrador | Ventas del mostrador modoops | fa-shopping-basket | bg-mid | action `point_of_sale.action_pos_config_kanban` | — |
|70| Aplicaciones | Instalar y gestionar módulos | fa-puzzle-piece | bg-deep | action `base.open_module_tree` | admin only |
|80| Ajustes | Configuración general | fa-cog | bg-deep | action `base_setup.action_general_configuration` | admin only |

- **Layout:** `mo-launcher-shell` con modifiers `--root` / `--hub` / `--compact` (`modoops_launcher.scss:33`), grid 3 cols → 2 cols ≤1024 → 1 col ≤768, `gap 1.25rem`, `max-width 80rem`. Tile horizontal `mo-launcher-tile` (body + barra lateral métrica 18% width, `modoops_launcher.scss:225`).

### 2.2 Hubs OWL (5 hubs composables)

Arquitectura: `mo.hub.section` (rail) + `mo.hub.card` (entry cards) + JS client action trio `*hub.js` + `*hub_action.js` + XML template. Servicio `mo_hub_service.js`, shell `mo_app_hub.js` / `mo_hub_section_body.js`, rail `mo_section_rail.js`, entry card `mo_entry_card.js`. Estilo `modoops_hub.scss`.

Ajuste: `views/modoops_app_menu.xml:4` y `data/hide_native_apps.xml:5` ocultan menús Odoo nativos (Stock/Ventas/Compras/Contabilidad/Discuss/POS) a solo `base.group_system`; operativos navegan solo por launcher + hubs + POS.

#### a) Depósito Inteligente (`app=inventory` — `data/hub_inventory_data.xml:6`)

- Secciones (5): `summary` (Resumen), `products` (Productos), `operations` (Operaciones), `reporting` (Informes), `config` (Configuración).
- Cards resumen 6: Productos, Variantes, Sin stock (warning), Bajo stock (warning), Movimientos de stock, Stock almacenable.
- Resto: `products` 5 cards (Cargar lista de precios → `action_mo_price_list_import`, Catálogo, Variantes, Categorías, Sin precio venta); `operations` 5 (Todos los movimientos, Internos, Recepciones, Entregas, Existencias); `reporting` 2; `config` 3 (Ubicaciones, Almacenes, Tipos de operación). **Total 21 cards**.

#### b) Ventas (`app=sales` — `data/hub_sales_data.xml:5`)

- Secciones (6): summary, quotations, orders, customers, reporting, config.
- Resumen 6: Pedidos confirmados, Cotizaciones, Ventas por facturar (warning), Clientes, Ventas mostrador hoy (pos.order today), Monto vendido hoy (sum today).
- Quotations 2, Orders 5 (Pedidos confirmados, Por facturar, Upselling, Ventas mostrador; 1 inactiva), Customers 2, Reporting 4, Config 4. **Total 23 active + 1 inactive (~24)**.

#### c) Compras (`app=purchase` — `data/hub_purchase_data.xml:5`)

- Secciones (5): summary, orders, vendors, reporting, config.
- Resumen 6: Órdenes de compra (purchase), Pedidos a proveedor (draft/sent), Por aprobar, Por recibir, Proveedores, Comprado hoy (sum today).
- Orders 6, Vendors 2, Reporting 1, Config 4. **Total 19 cards**.

#### d) Cobros / Fiscal (`app=accounting` — `data/hub_accounting_data.xml:5`)

- Secciones (5): summary, receivables (Por cobrar), payables (Por pagar), reporting, config.
- Resumen 7: Por cobrar (warning), Por pagar (warning), Borradores, Pagos registrados, Pendientes Factura Web (warning), Facturado hoy, Resumen diarios.
- Receivables 8 (overdue/due_today/due_week + facturas/notas/borradores/pagos/clientes), Payables 8 (simétrico), Reporting 5 (FW pendiente + diarios + análisis + apuntes + asientos), Config 4. **Total 32 cards**.

#### e) Taller (`app=workshop` — `data/hub_workshop_data.xml:4`) — behind `group_modoops_workshop` (`security/modoops_groups.xml:4`)

- Secciones (3): summary, orders, appliances.
- Resumen 3: Nueva orden (Crear), Órdenes de trabajo, Artefactos.
- Orders 2, Appliances 1. **Total 6 cards**.

### 2.3 Backend Odoo views (tradicional)

- `views/mo_workshop_views.xml:3`: `mo.appliance` list (serial/brand/model/name/gas_type/work_order_count/partner) + form (one2many work_order_ids inline: date/name/owner/state/amount/deposit/collected); `mo.work.order` list (date/name/serial/owner/phone/amount/deposit/collected/state) + form (header statusbar + buttons Cerrar/Volver a borrador, sheet 2 groups). Actions `action_mo_appliance`, `action_mo_work_order`, `action_mo_work_order_new` (default draft) — todas `groups group_modoops_workshop`.
- `views/product_template_views.xml:5`: inherit `product.product_template_form_view` **inactiva** (`active False`) — campo `mo_stock_min_qty` oculto (usa mínimo global en Ajustes, opción A).
- `views/product_form_views.xml:4`: inherit hide chatter (`//chatter → replace`) + añade clase `sg-form-no-chatter sg-product-form`.
- `views/mo_price_list_import_views.xml:3`: wizard `mo.price.list.import.wizard` 4 estados (upload → mapping → preview → done) + action `action_mo_price_list_import` target new + log list.
- `views/hide_chatter_forms.xml`, `views/views.xml` (comentado), `views/templates.xml` (comentado) sin impacto.
- `report/mo_*` (no auditado en detalle: `mo_modoops_layout.xml`, `mo_work_order_report.xml`) — print OT.

### 2.4 Login y shell chrome

- `views/login_templates.xml:4`: 3 templates — webclient title `modoops`, POS index title `Mostrador modoops`, login fonts Montserrat, login layout `sg-login-glass-panel sg-view-enter` + `sg-login-page` oscuro con `modoops_mark.png`.
- `static/src/js/chrome/*`: `mo_rail_nav.js`, `mo_mobile_bottom_bar.js`, `mo_webclient_patch.js`, `mo_rail_service.js`, `mo_nav_user_service.js` — rail desktop + bottom bar móvil.

### 2.5 POS (Mostrador)

- `__manifest__.py:129` POS assets: `modoops_tokens.scss` + `modoops_pos.scss:1` + `mo_pos_theme.js` + `mo_pos_order_discount.js` + `mo_product_screen_order_discount.js`.
- `modoops_pos.scss`: tema oscuro ` $mo-bg-ambient`, header glass, leftpane glass, rightpane transparente, command bar pill `mo-command-bar`, product tile `.product` glass, fallback `.no-image`, ticket vacío `Tocá un producto...` (::before), orderline densa, numpad discount + order-discount 4 cols, paymentScreen/receiptScreen oscuros con CTA `sg-flame-cta`, modal actions glass.

## 3) Tokens Liquid Glass v2

Fuente canónica implementada: `static/src/scss/modoops_tokens.scss:1` + implementaciones por bundle.

| Token | Valor | Rol |
|-------|-------|-----|
| `$mo-flame-yellow` | `#ffd600` (`--mo-flame-yellow`) | CTA primario / active rail light |
| `$mo-flame-yellow-hover` | `#ffe033` | hover CTA |
| `$mo-flame-orange` | `#f57c00` (`--mo-accent` en POS, `--mo-accent-alt`) | acento default, border focus |
| `$mo-flame-deep` | `#e64a19` (`--mo-primary`, `--mo-accent` backend) | borde rail 2px, primary brand, gradient stop |
| `$mo-flame-rust` | `#bf360c` | hover primary darken |
| `$mo-ember-amber` | `#ffb300` | tile Taller |
| `$mo-ember-coral/scarlet/wine` | `#ff7043` / `#ef5350` / `#c62828` | reservas Tiles |
| `$mo-bg-deep` | `#1a1a1a` | fondo POS/rail top |
| `$mo-bg-charcoal` | `#2b2b2b` | rail mid |
| `$mo-bg-mid` | `#333333` | fondo ambient gradient stop |
| `$mo-paper` | `#f7f5f2` (≠ `#f5f5f5` DESIGN.md) | fondo launcher/hub main `--mo-paper` |
| `$mo-canvas` | `#efecea` | fondo form sheet `o_form_sheet_bg` |
| `$mo-text-on-dark` | `#ffffff` | texto sobre oscuro |
| `$mo-text-muted-dark` | `rgba(255,255,255,0.72)` | secundario oscuro |
| `$mo-text-on-light` | `#1a1a1a` | texto sobre papel |
| `$mo-radius-card` | `12px` (≠ 20px DESIGN.md) | cards / modals / inputs |
| `$mo-radius-pill` | `999px` (≠ 80px DESIGN.md) | pills / botones / rail |
| `$mo-glass-blur` | `16px` | backdrop-filter |
| `$mo-flame-gradient` | `135deg yellow→orange→deep` | CTA primary |
| `$mo-bg-ambient` | `radial 80%×50% orange 0.18 + radial 60%×40% deep 0.12 + linear 165deg mid→deep→#111` | fondo POS / login |
| `--mo-rail-width-*` | `3.5rem` collapsed / `17.5rem` expanded / `220ms` | rail |
| `--mo-glass-fill*` | `0.08/0.14` dark / `0.55/0.72` light | superficies glass |
| Font | `Montserrat, Segoe UI, system-ui` (≠ Inter / system-ui DESIGN.md) | `modoops_tokens.scss:34` |

Mixins: `sg-glass-surface($elevated, $on-dark)` + `sg-flame-cta` (`modoops_tokens.scss:63`).

**Desvío doc:** `docs/DESIGN.md:20` describe `DESIGN.md` Neuralink adaptado para landing (`midnight-void #000`, `canvas-white #fff`, `soft-linen #f5f5f5`, `ash-gray #bababa`, `trust-slate #1a3a52`, Inter, radius 80/20/16, section-gap 50px) — **no coincide** con `modoops_tokens.scss` (marca llama + glass). Fuente real para Gestor es `docs/design/modoops-brand.md` (citado en tokens header, no leído aquí) + tokens SCSS. DESIGN.md debe marcarse obsoleto para backend/POS.

## 4) Navegación

```
Login (sg-login-page dark) → launcher (app_launcher, 9 tiles)
  → hub (section rail + KPI cards) → action Odoo (list/form/kanban) → form
  → POS (standalone /pos/ui, entry via tile Mostrador)
Rail global (mo-rail / .o_action_manager margin-left) + rail hubs + bottom bar móvil
```

- **Global rail (`static/src/scss/modoops_rail.scss:19`):** fixed left `100vh`, `width var(--mo-rail-width-collapsed)` → `expanded 17.5rem`, gradient `deep→charcoal→mid`, `border-right 2px flame-deep`, top logo+home+togle, `__apps` scrollable (launcher tiles como apps), `__sections` (hub sections inyectadas), `__footer` user menu, móvil `display:none` + `.mo-mobile-bar` flex bottom fixed (≤767px, `mo-rail-enabled` margin-left 0, padding-bottom safe-area).
- **Hubs rail (`static/src/scss/modoops_hub.scss:55`):** `.mo-section-rail` 3.5rem → 17.5rem, border-right `1px rgba(255,255,255,0.08)`, item `border-left 3px transparent` → active `flame-deep` + bg `rgba(flame-deep,0.18)`, label opacity 0→1 en expanded, toggle abajo.
- **App launcher hub-shell (`modoops_launcher.scss:4`):** `mo-launcher-shell--root --hub --compact` trade-offs padding-top 3.25rem contrato `resolveLauncherHomeGridInset`/`resolveHubKpiGridInset` (comentarios línea 40, 55).
- **Preferencias:** `mo_nav_user_service.js` / `mo_rail_service.js` + `mo_shell_path.js` persistencia estado rail (collapsed/expanded) + onboarding smoke/host.
- **Escape hatch:** `views/modoops_app_menu.xml:4` menu `modoops` solo `base.group_system`; `hide_native_apps.xml:5` restringe apps Odoo visibles a admin → operativos no ven navbar Odoo nativo, solo launcher+rail.

**Flujo observado (código, no click-path medido):** Login → launcher (1 click tile) → hub section (1 click rail) → card → acción (1 click card) = **3 clicks a listado**; a form = 4 clicks (card → list → row). POS: Launcher tile Mostrador → kanban POS configs → abrir sesión → productScreen (≥3 pasos). Métrica objetivo `≤3 clicks Mostrador` aún no alcanzada sin shortcut directo a ProductScreen.

## 5) Debt list (priorizada)

1. **[ALTA] DESIGN.md divergente:** landing tokens (midnight-void/Inter/80px) vs Gestor tokens (llama/Montserrat/12px). Riesgo de copy/paste cross-bundle. Acción: archivar DESIGN.md como `docs/landing/DESIGN.md` o añadir banner divergencia + fuente canónica `modoops_tokens.scss`.
2. **[ALTA] Sin métrica instrumentada ≤3 clicks:** No hay telemetría click-pathlauncher→POS. `P4 Not yet specified: Métricas instrumentadas` abierto. Acción: evento `mo_rail_nav` + timing en `mo_launcher_service`.
3. **[ALTA] Hub cards con métricas placeholder/degeneradas:** `hub_inventory low_stock` usa `qty_available <= 999999` siempre true (`hub_inventory_data.xml:99`); `hub_sales amount_today` y `purchase amount_today` agregan sum sin date scope aplicado en UI? Verificar `mo_hub_service metric_date_field/scope` soporta `today`; POS tile sin métrica. Acción: corregir dominios o documentar como KPI “mock”.
4. **[MEDIA] `product_template_views.xml` inactiva fantasma:** `active False` con xpath (`modoops_core/views/product_template_views.xml:9`) deja técnica muerta. Borrar o documentar ADR, no mantener XML comentado/activo falso.
5. **[MEDIA] Chatter oculto globalmente:** `product_form_views.xml:12` `//chatter replace` + clase `sg-form-no-chatter` rompe trazabilidad (mensajes, actividades). Si es intencional para catálogo, limitar con `groups` o toggle config, no global.
6. **[MEDIA] Accesibilidad glass sobre oscuro:** `mo-text-muted-dark 0.72` + `glass fill 0.08` puede fallar WCAG AA en texto secundario (hint labels). Faltan `prefers-contrast` y ratio audit. Acción: agregar token `--mo-text-muted-dark-AA` y lint `axe`.
7. **[MEDIA] SCSS duplicación animaciones:** `sg-view-fade-in` definida en `modoops_hub.scss:250` + `modoops_launcher.scss:361` + `modoops_login.scss:176` (3 variantes) + shimmer duplicado. Consolidar en `modoops_tokens.scss` o `modoops_backend.scss`.
8. **[MEDIA] Rail state sin URL deep-link:** hub section activa vive en estado OWL/memory (`mo_rail_context`, `mo_shell_path`), no en `hash`/`query`. Refresh pierde sección. Acción: sincronizar `mo_shell_path` con URL o `localStorage` idempotente.
9. **[BAJA] Tiles con `target_type action` sin view_mode explícito:** Clientes/Apps/Ajustes abren `action_id` pero sin garantizar `view_mode list,form,kanban`; comportamiento depende de action Odoo base. Documentar o envolver con `ir.actions.act_window` proxy modoops.
10. **[BAJA] Onboarding smoke/host sin scope UI-UX:** 7 servicios `mo_onboarding_*` en `__manifest__.py:78` sin docs en `ui-ux/map.md`. Si el onboarding es spec pendiente (TBD), aislar flag feature `mo_onboarding_smoke.scss`.

## 6) Siguientes pasos (no cierra ticket)

- Capturar screenshots (Playwright authenticated) → `research/auditar-ui-actual/screenshots/`.
- Decidir fuente DESIGN.md (mover a landing) vs `modoops-brand.md`.
- Validar métricas `today`/`overdue` en `mo_hub_service.js:??` con data real staging.
- Medir click-path real mostrador y registrar gap vs ≤3.

---
*Auditado sobre: `modoops_core/views/*.xml` (7 files), `data/hub_*.xml` (5), `data/launcher_tiles_data.xml`, `__manifest__.py assets`, `static/src/scss/*.scss` (10), `static/src/js/**` index, `CONTEXT.md`, `docs/DESIGN.md`, `localhost:8070 200`.*
