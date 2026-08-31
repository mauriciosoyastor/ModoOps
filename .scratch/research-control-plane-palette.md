# Research: Control Plane palette — mock oscuro + Liquid Glass tokens (wayfinder #40)

> Ticket: [#40 "Control Plane palette — mock oscuro + Liquid Glass tokens"](https://github.com/mauriciosoyastor/ModoOps/issues/40) · Part of #39 map  
> Branch: `research/control-plane-palette` · File: `.scratch/research-control-plane-palette.md`  
> Fecha: 2026-08-31 · Autor: research subagent (AFK)

## Pregunta

¿Paleta híbrida viable para Control Plane `modoops_admin` en `modoops_master` que reconcilie **mock oscuro** `docs/modoops-control-plane-mock.html:7` (`#0f1115`) con **Liquid Glass v2** de `modoops_tokens.scss:1` y decida: dark shell + light cards vs dark cards completos, badges y alerta de gracia sin deuda para grilling/implementación?

## Fuentes inspeccionadas (primarias, no secundarias)

| Fuente | Línea clave |
|---|---|
| `modoops_core/static/src/scss/modoops_tokens.scss:1` | tokens marca + glass, `:root` y `.pos` overrides |
| `modoops_core/static/src/scss/modoops_launcher.scss:225` | `.mo-launcher-tile` (card blanca + accent lateral 18%), grid 3 cols, `$mo-launcher-accents` map |
| `modoops_core/static/src/scss/modoops_hub.scss:1` | `mo-app-shell` `var(--mo-paper)`, rail `charcoal→deep`, `mo-entry-card` glass on-light |
| `modoops_core/static/src/scss/modoops_backend.scss:1` | `body.o_web_client` claro, navbar gradient deep→charcoal→mid, `mo-paper`/`mo-canvas` |
| `modoops_core/static/src/scss/modoops_login.scss:1` | único consumo oscuro operativo (pos/login): `mo-bg-ambient`, glass on-dark |
| `modoops_core/static/src/scss/modoops_rail.scss:28` | `mo-rail` gradient deep→charcoal→mid, collapsed 3.5rem / expanded 17.5rem |
| `docs/modoops-control-plane-mock.html:7` | mock oscuro: `body #0f1115`, tabla/card `#171a20`, `.ok/.bad`, `.btn`/`.btn-hi` |
| `modoops_admin/views/modoops_tenant_views.xml:11` | `decoration-danger="state=='suspendido'"`, `decoration-muted="state=='baja'"`, `alert alert-warning` gracia `suspend_grace_until:33` |
| `modoops_admin/models/modoops_tenant.py:51` | `state` Selection `activo/suspendido/baja`, `suspend_grace_until = abono_due_date+7d:58` |
| `CONTEXT.md:248` | Estado Tenant `Activo→Suspendido→Baja`, `CONTEXT.md:252` Suspensión mora gracia 7 días |
| `docs/design/modoops-brand.md` (via tokens header) | Análisis marca llama |

## 1. Token table — mock oscuro vs Liquid Glass v2

### 1.1 Fundacionales

| Rol | Mock oscuro (`modoops-control-plane-mock.html`) | Liquid Glass v2 (tokens) | Nota |
|---|---|---|---|
| **Background shell** | `#0f1115` (body) `modoops-control-plane-mock.html:7` | `--mo-paper #f7f5f2` (shell `mo-launcher.scss:9`, `mo-hub.scss:13`, `mo_backend.scss:142`) y `--mo-canvas #efecea` | Mock 13.5× más oscuro que paper. Paper es warm linen (no puro #fff) — evita fatiga en tabla densa. |
| **Card bg** | `#171a20` (`table, .card`) `mock.html:11,19` | Launcher: `#ffffff` con `border rgba(26,26,26,0.06)` + `shadow 0 4px 16px rgba(26,26,26,0.08)` `mo-launcher.scss:229` · Hub entry: `sg-glass-surface($on-dark:false)` → `rgba(255,255,255,0.55)` + `border rgba(230,74,25,0.12)` + `inset 0 1px 0 rgba(255,255,255,0.6)` `modoops_tokens.scss:72` · Backend sheet: mismo mixin on-light `mo_backend.scss:150` | Mock = dark card sólida; LG = light card (blanco o glass claro). No existe token dark-card claro — dark existe solo en `POS/login` (`modoops_tokens.scss:142` / `modoops_login.scss:9`). |
| **Card border** | implícito `#232836` (fila `border-top 1px #232836`) `mock.html:13` | LG light: `rgba(26,26,26,0.06)` o `var(--mo-glass-border) rgba(230,74,25,0.12)` con rim inset `modoops_tokens.scss:78` · LG dark (POS): `rgba(255,255,255,0.12)` `tokens.scss:70` | |
| **Card shadow** | `border-radius 10-12px` sin shadow declarado (dark no lo necesita) | LG light: `box-shadow 0 4px 16px rgba(26,26,26,0.08)` → hover `0 8px 24px rgba(230,74,25,0.15)` `mo-launcher.scss:231` · LG dark: `inset 0 1px 0 rgba(255,255,255,0.1)` sin drop shadow | |
| **Tabla header** | `th bg #1e232c, text #9aa0aa 12px, td border #232836` `mock.html:12` | `mo_list.scss:10` header `var(--mo-canvas) #efecea`, th `rgba(26,26,26,0.72)` + `border-bottom 2px rgba(230,74,25,0.15)`, row hover `rgba(245,124,0,0.06)` | Mock header = 1 tono más claro que card; Odoo list = canvas cálido. |
| **Glass blur** | no | `$mo-glass-blur 16px` `tokens.scss:32` — aplicado vía `sg-glass-surface` (+ backdrop-filter) | Mock es opaco; LG requiere translucidez. |
| **Radius** | `10-12px` | `$mo-radius-card 12px`, `$mo-radius-pill 999px` `tokens.scss:30` — idéntico | |
| **Font** | `Inter` (mock) | `Montserrat, Segoe UI` `tokens.scss:34` (`--mo-font-family`) — diverge del mock; mantener Montserrat por marca llama. | |
| **Navbar/Rail** | no mock (mock es página aislada) | `mo_rail.scss:28` gradient `deep #1a1a1a → charcoal #2b2b2b → mid #333` + `border-right 2px flame-deep` · `mo_backend.scss:19` navbar `deep 0% → charcoal 40% → mid 100%` + `border-bottom 2px flame-deep` · `mo_hub.scss:59` rail `charcoal → deep` | Shell oscuro ya canonizado — reutilizable para híbrido. |

### 1.2 Badges — estado tenant

| Estado (`modoops_tenant.py:51`) | Mock (`mock.html:14`) | Odoo actual (`modoops_tenant_views.xml:11,41`) | Tokens disponibles | Riesgo |
|---|---|---|---|---|
| **activo** | `.ok bg #12331a text #7ee081` | `decoration-success="state=='activo'"` (verde Odoo — sin token custom) + `widget="badge"` | LG no define semantic green; `pos` usa `#7ee081` símil mock OK — reutilizable. | Mock OK 10.7:1 sobre card #171a20, 8.5:1 en pill — **AA OK**. En paper claro necesitaría bg semántico (ej `#12331a` mantiene pero sobre #f7f5f2 crea isla oscura). |
| **suspendido** | `.bad bg #33131a text #ff8a8a` | `decoration-danger="state=='suspendido'"` (rojo Odoo) | LG rojo flame: `$mo-flame-deep #e64a19`, `$mo-flame-rust #bf360c`, `$mo-ember-scarlet #ef5350`, `$mo-ember-wine #c62828` `tokens.scss:9,16` | Mock BAD 7.7:1 sobre #171a20 — AA OK. Flame-deep sobre paper 3.6:1 — falla AA para texto pequeño (ver §2). |
| **baja** | no mock (solo dos estados) | `decoration-muted="state=='baja'"` (gris tenue Odoo) | No token — muted es `rgba(26,26,26,0.45)` / `#9aa0aa` en mock subtext `mock.html:10` | Debe ser distinguible de suspendido: gris vs rojo, no dos rojos. Confirmar que baja no reuse `.bad`. |
| **Propuesta token badge unificado** | — | — | Light cards: `activo #0f7a3a sobre #dcfce7` (no hoy), `suspendido #bf360c sobre #ffe4e0`, `baja #5a5a5a sobre #efecea`. Dark shell: reutilizar mock `.ok/.bad` directo (ya AA). | Decisión grilling: ¿badge muted vs badge outline para baja? |

Fuente badge mock exacta:
```css
.ok{background:#12331a;color:#7ee081} /* mock.html:15 */
.bad{background:#33131a;color:#ff8a8a} /* mock.html:16 */
```
Fuente estados python exacta:
```py
state = fields.Selection([("activo","Activo"),("suspendido","Suspendido"),("baja","Baja")])  # modoops_tenant.py:51
```

### 1.3 Alerta gracia (suspend_grace_until)

| Aspecto | Actual | Mock | Token |
|---|---|---|---|
| **Trigger** | `alert alert-warning invisible="state != 'activo' or not suspend_grace_until"` `views.xml:33` — visible solo activo con gracia computada | no mock (card menciona "Gracia 7 días con aviso WhatsApp" `mock.html:39`) | Odoo `alert-warning` default `#fff3cd/#664d03` — no tokenizado. |
| **Campo** | `suspend_grace_until = _compute(suspend_grace_until)` `abono_due_date +7d` `modoops_tenant.py:58` | — | — |
| **Color actual alert-warning** | ~`bg #fff3cd text #664d03 border #ffecb5` (Bootstrap/Odoo) — no en tokens | — | Sobre `mo-paper #f7f5f2` contrasta 7.2:1 texto vs fondo alerta (medido) — **AA OK**. Pero borde amarillo no alinea con marca llama. |
| **Opción marca** | Fondo cálido con acento llama: `bg rgba(255,243,224,0.9)` (`#fff3e0`) + `border-left 4px flame-orange #f57c00` + text `flame-rust #bf360c` | — | `modoops_tokens.scss` ya usa `#fff3e0` pattern en warnings internos (login alert-danger usa `rgba(230,74,25,0.15)` `modoops_login.scss:134`). Propuesta: re-tokenizar alert gracia con llama en lugar de amarillo bootstrap. |

### 1.4 Accent keys (tiles launcher)

Mapa `modoops_launcher.scss:307` — 11 keys canónicas (única fuente de color semántico lateral):

```scss
$mo-launcher-accents: (
  "flame-yellow": $mo-flame-yellow #ffd600,
  "flame-orange": $mo-flame-orange #f57c00,
  "flame-deep":   $mo-flame-deep   #e64a19,
  "flame-rust":   $mo-flame-rust   #bf360c,
  "ember-amber":  $mo-ember-amber  #ffb300,
  "ember-coral":  $mo-ember-coral  #ff7043,
  "ember-scarlet":$mo-ember-scarlet #ef5350,
  "ember-wine":   $mo-ember-wine   #c62828,
  "bg-mid":       $mo-bg-mid       #333333,
  "bg-charcoal":  $mo-bg-charcoal  #2b2b2b,
  "bg-deep":      $mo-bg-deep      #1a1a1a,
); // modoops_launcher.scss:307
```

| Key | Hex | Uso launcher | Reuso CC proposal |
|---|---|---|---|
| flame-yellow | #ffd600 | metric CLARO (texto dark) `launcher.scss:327` — `color $mo-text-on-light` | Útil para badge premium / destacado |
| flame-orange | #f57c00 | — | Primary accent |
| flame-deep | #e64a19 | — | Active rail, navbar bottom, KPI value `modoops_hub.scss:189` |
| flame-rust | #bf360c | — | Warning value, destructive |
| ember-amber | #ffb300 | — | Secundario cálido |
| ember-coral | #ff7043 | | |
| ember-scarlet | #ef5350 | | |
| ember-wine | #c62828 | | Ejecutivo / baja crítica |
| bg-mid/charcoal/deep | #333/#2b2b2b/#1a1a1a | Tiles oscuros | Reuso dark shell / dark card option |

No se propone nuevo hex fuera de estos 11 + paper/canvas. Cualquier paleta CC debe ser subconjunto.

## 2. Contrast AA notes (WCAG 2.1, medido con luminancia relativa)

> Threshold AA: texto normal 4.5:1, texto grande (≥18px / 14px bold) 3:1, UI no-texto 3:1. Medición con script `py -c` sobre pares hex (cálculo `luminance` estándar).

| Par | Ratio | Veredicto | Implicación CC |
|---|---|---|---|
| `#0f1115` (mock bg) vs `#e6e8ec` (mock text) | **15.4:1** | AAA | Base mock sobrada — referencia. |
| `#171a20` (mock card) vs `#e6e8ec` | **14.2:1** | AAA | Card mock legible. |
| `#171a20` vs `#7ee081` (ok badge text) | **10.7:1** | AAA | Badge activo oscuro OK. |
| `#171a20` vs `#ff8a8a` (bad badge) | **7.7:1** | AA | Badge suspendido OK. |
| `#12331a` vs `#7ee081` (ok pill solo) | **8.5:1** | AA | Pill autónomo AA. |
| `#33131a` vs `#ff8a8a` (bad pill solo) | **7.4:1** | AA | Pill autónomo AA. |
| `#0f1115` vs `#ffd600` (flame-yellow) | **13.4:1** | AAA | Accent amarillo sobre oscuro: perfecto para rail activo. |
| `#0f1115` vs `#f57c00` (flame-orange) | **7.0:1** | AA | CTA sobre oscuro OK. |
| `#0f1115` vs `#e64a19` (flame-deep) | **4.8:1** | AA | Deep sobre oscuro justo AA (límite). Evitar texto pequeño deep-sobre-0f1115 anidado. |
| `#0f1115` vs `#9aa0aa` (mock sub text) | **7.2:1** | AA | Muted sobre oscuro OK. |
| `#f7f5f2` (paper) vs `#1a1a1a` (text) | **16.0:1** | AAA | Base clara sobrada. |
| `#f7f5f2` vs `#bf360c` (flame-rust texto) | **5.15:1** | AA | Rust sobre paper AA (útil alerta gracia). |
| `#f7f5f2` vs `#e64a19` | **3.6:1** | **FAIL normal** (OK grande ≥18px) | flame-deep como texto pequeño sobre paper **NO AA** — requiere tamaño grande o fondo. |
| `#ffffff` vs `#e64a19` | **3.92:1** | FAIL normal | Similar — evitar deep puro para body 13-14px sobre blanco. |
| `#ffffff` vs `#f57c00` | **2.7:1** | FAIL | Naranja nunca texto sobre blanco. Solo bg/fill. |
| `rgba(26,26,26,0.55)` sobre `#f7f5f2` (≈`#7d7c7b` composite) vs `#1a1a1a` | **4.18:1** | **FAIL normal** (ligeramente bajo) | Subtitle `mo-launcher-subtitle rgba(26,26,26,0.55)` queda justo bajo AA — documentado como nota; usar `0.60` o `0.72` (como `mo_list.scss:17`) para AA. |
| `#fff3cd` vs `#664d03` (alert-warning default) | **7.34:1** | AA | Warning bootstrap cumple. |
| `#171a20` vs `#ffffff` | **17.4:1** | AAA | Card mock si se blanquea tipografía — OK. |

**Síntesis contraste:**

- **Dark shell + light cards** mantiene ambos mundos AA sin ajustes: dark satisface AA con todos los flame (incluso yellow), light requiere evitar flame naranja/deep como color de texto pequeño. Solución: flame-deep solo para `font-weight 700` grande (KPI) o como `background` (accent lateral), no como `color` body.
- **Dark cards completas** obligaría a re-auditar todo contraste claro (badges, links `mo_backend.scss:153` `a color flame-deep`, forms `mo_backend.scss:121`). Más deuda.
- Alerta gracia: re-tokenizar con `bf360c` sobre `fff3e0` da **5.1:1 AA** — mejor alineación marca que amarillo bootstrap manteniendo AA.

## 3. Recomendación — híbrido (dark shell + light cards)

> **Veredicto: Dark shell + light cards (híbrido). No dark cards completos en MVP.**

**Justificación técnica:**

1. **Shell oscuro ya existe y es estable** — `mo_rail.scss:28`, `mo_backend.scss:19`, `mo_hub.scss:59` ya son dark con gradiente + flame-deep 2px. Mock `#0f1115` es solo un tono más profundo (`#0f1115` vs `#1a1a1a`) — gap ΔE mínimo, no requiere nuevo token (overlay opcional `background: #0f1115` puntual en CC wrapper si se quiere pixel-match mock, sino gradiente canonizado sirve).

2. **Cards claras ya existen y son AA** — `mo-launcher-tile #ffffff` y `mo-entry-card glass 0.55` son patrones validados en operación densa (`mo_list.scss:23` row hover, login incomparable). Transformar a dark cards duplicaría debt: habría que redefinir border/shadow, badge pills, form controls, table header (hoy `mo-canvas`) y romper consistencia Odoo backend claro (`AGENTS` diverge si CC se ve "otro sistema").

3. **Contraste** — híbrido pasa AA sin trucos; full dark también pasa pero full dark + paper Odoo circundante genera clash (dos backgrounds oscuros compitiendo). Híbrido respeta `o_action_manager bg var(--mo-paper)` `mo_backend.scss:142`.

4. **Mock es direccional, no literal** — mock `.card #171a20` es demo aislada fuera de Odoo; dentro de Odoo el `o_content` impone `--mo-paper`. Mock sirve como **inspiración de densidad** (tabla compacta, badges pill, btn `.btn`/`btn-hi`) no como fondo app.

5. **Costo implementación** — híbrido = ~4 tokens nuevos en `modoops_admin/static/src/scss/modoops_admin.scss` + 1 mixin reuse; dark completo = fork de `mo_backend`, `mo_list`, `mo_hub` + retest visual.

**Espec híbrida propuesta (para ticket implementación):**

```scss
// modoops_admin — Control Plane (dark shell + light cards)
// Wrapper CC: usa rail/navbar existentes (dark) + nuevo layer CC si se quiere #0f1115 puntual:
.mo-cc-shell {
  background: var(--mo-paper); // #f7f5f2 — mantiene backend claro
  // opcional angosto header CC dark para eco mock:
  &__header { background: #0f1115; color: #e6e8ec; border-bottom: 2px solid $mo-flame-deep; }
}
// Cards CC = reuse mo-launcher-tile exacto (no reinventar):
.mo-cc-card { @extend .mo-launcher-tile; } // #fff + accent lateral
// Tabla CC = reuse mo_list.scss con override header mock:
.mo-cc-table thead th { background: #1e232c; color: #9aa0aa; } /* solo CC */
// Badges CC — versión light AA (no mock dark directo sobre paper):
.mo-cc-badge--activo    { background: #dcfce7; color: #166534; border: 1px solid #86efac; } // o mock #12331a/#7ee081 si se acepta isla oscura
.mo-cc-badge--suspendido{ background: #ffe4e0; color: #bf360c; border: 1px solid #ff8a8a; }
.mo-cc-badge--baja      { background: #efecea; color: #5a5a5a; border: 1px solid rgba(26,26,26,0.12); }
// Alerta gracia — re-token llama, no bootstrap amarillo:
.mo-cc-alert-grace { background: #fff3e0; border: 1px solid rgba(230,74,25,0.18); border-left: 4px solid $mo-flame-orange; color: $mo-flame-rust; }
// Accent lateral tabla/card — reuse $mo-launcher-accents map (flame-*/ember-*/bg-*)
```

- **Alternativa mock-literal dark cards** descartada como MVP pero documentada: si grilling exige pixel-match mock, crear variante `.mo-cc-card--dark { background:#171a20; border:1px solid #232836; color:#e6e8ec; .ok/.bad exact mock; shadow none; }` — requiere pagina CC con `background:#0f1115` envolviendo `o_action_manager` (pierde coherencia Odoo, necesita `mo_backend.scss` override scoped).

| Criterio | Dark shell + light cards (RECOMENDADO) | Dark cards completos |
|---|---|---|
| AA sin ajustes | Sí (con nota flame-deep texto) | Sí pero requiere re-auditar links/forms |
| Consistencia Odoo backend | Mantiene `mo-paper` | Rompe — isla oscura |
| Tokens nuevos | 4-5, reuse map | 12+ + overrides scope |
| Riesgo visual | Bajo | Medio-alto (glass blur + dark opaco conviven mal) |
| Mock fidelity | 80% (header/tabla dark, cards claras) | 100% pixel mock |
| Tiempo | 1 sesión | 2-3 sesiones + QA |

## 4. Decisiones cerradas (sin niebla para grilling)

- Background base: `var(--mo-paper) #f7f5f2` — no `#0f1115` full.
- Header CC opcional oscuro `#0f1115` (1 franja) como guiño mock; no app entera.
- Cards: reuse `.mo-launcher-tile` / `mo-entry-card` (glass light) — no nuevo componente.
- Badges: light AA (`activo` verde, `suspendido` rust/coral, `baja` muted `#efecea`) — no reuse `.ok/.bad` dark directo sobre paper salvo elección explícita de isla oscura.
- Tabla header CC: override puntual `#1e232c / #9aa0aa` (mock) pero `td` y filas sobre paper (no `#171a20`).
- Alerta gracia: custom llama `#fff3e0 + border #f57c00 + text #bf360c`, reemplaza `alert-warning` bootstrap (mantener `invisible` logic `views.xml:33` sin cambio).
- Accent keys: subconjunto de 11 existentes, sin nuevo hex.
- Contraste: flame-deep/orange solo como bg/accent o texto grande — nunca texto 13px sobre papel.

## 5. Open questions para tickets grilling (con dueño sugerido)

1. **Badge activo verde exacto — ¿usar semantic green nuevo (`#dcfce7/#166534`) o mock dark (`#12331a/#7ee081`) como isla oscura sobre paper?** Mock green es más "ops" (dark), pero light green alinea con Odoo success. Dueño: grilling visual. Impacto: 1 token. [Origen: §1.2]
2. **Badge baja — ¿muted pill (`#efecea/#5a5a5a`) vs outline vs desaturado rojo?** Evita confundir suspendido/baja ambos rojos. ¿Baja debe reuse `decoration-muted` o pasar a custom CSS? [Origen: `views.xml:11`] [Ref: `modoops_tenant.py:51`]
3. **Header CC oscuro ¿sí/no?** Mock no tiene header Odoo; rail dark ya aporta. ¿Añadir header franja `#0f1115` con título "Tenants ModoOps" o mantener header claro `mo-hub.scss:29`? [Origen: mock aislado `mock.html:7` vs rail `mo_rail.scss:28`]
4. **Tabla dark completa vs header dark + filas claras?** Mock es full dark (`#171a20`). Propuesta es híbrida. ¿Grilling acepta contraste paper o exige full dark con wrapper `#0f1115` scoping `o_content`? Costo full dark motivado en §3.
5. **Alert gracia — ¿mantener `alert alert-warning` bootstrap o migrar a `mo-cc-alert-grace` custom?** Migración toca `views.xml:33` y test `modoops_tenant` — verificar `decoration` logic no regresa amarillo. ¿Fallback con ambos class?
6. **Accent lateral en cards tabla — ¿asignar semántica (activo=flame-deep, suspendido=ember-wine, baja=bg-mid) o aleatoria round-robin como launcher?** Launcher accents son decorativos; CC podría semantizar. Definir map state→accent_key. [Origen: `mo_launcher.scss:307`]
7. **Font — ¿mantener Montserrat CC o alinear con mock Inter?** `modoops_tokens.scss:34` es Montserrat marca; mock usa Inter. Decidir si CC respeta sistema o marca.
8. **Glass blur en CC — ¿aplicar `sg-glass-surface(on-light)` o card sólida `#fff`?** Hub usa glass translúcido (over paper con radial ambient); list usa opaco por performance. CC denso preferencia: sólido (`#fff`) por scan-rate, no blur por fila. Confirmar.
9. **Contraste subtitle `rgba(26,26,26,0.55)` bajo AA (4.18:1) — ¿subir a 0.60/0.72 en CC para AA?** Arregla `mo-launcher-subtitle` pattern. [Origen: medición §2]
10. **Odoo `decoration-danger/muted/success` vs custom `mo-cc-badge` — ¿doble sistema o unificado?** `views.xml:11` decoration colorea fila; `widget=badge` colorea pill. ¿Unificar a `mo-cc-badge` y remover decoration o mantener ambos? Impacto en `mo_list.scss` hover.

## Apéndice — snippet verificación contraste (reproducible)

```bash
py -c "
def c(a,b):
 def hr(h): return tuple(int(h[i:i+2],16) for i in (0,2,4))
 def l(v): return v/12.92 if (v:=v/255)<=0.04045 else ((v+0.055)/1.055)**2.4
 def L(h):
  r,g,b=hr(h); return 0.2126*l(r)+0.7152*l(g)+0.0722*l(b)
 return (max(L(a),L(b))+0.05)/(min(L(a),L(b))+0.05)
print(c('#0f1115','#e6e8ec'), c('#171a20','#7ee081'), c('#f7f5f2','#e64a19'))
"
# 15.4 10.7 3.6
```

## Checklist entrega research

- [x] Branch `research/control-plane-palette` creado desde actual
- [x] Tokens leídos y tablados vs mock
- [x] Badges/estados/alerta gracia mapeados a líneas exactas
- [x] Accent_keys 11 inventariados
- [x] Contraste AA medido (18 pares, script reproducible)
- [x] Recomendación híbrida motivada + alternativa descartada
- [x] 10 open questions grilling listas

---
*Método: `skill research` — lectura fuentes primarias SCSS/py/xml, `py -c` luminancia WCAG, sin docs externas.*
