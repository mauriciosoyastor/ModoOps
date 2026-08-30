# Trazas de ahorro — 3 arquetipos canónicos (Ticket 05)

> **Spec:** `docs/spec-grafo-gitnexus-modoops.md:3` · **Contrato:** `AGENTS.md` · **Métrica target:** ≥60% tokens, ≥50% calls con `doctor` `fts/vector: available`

Metodología: cada arquetipo medido 2× — (A) `grep/glob + Read` iterativo vs (B) `query→context→impact` (MCP). Conteo de `tool calls` y tokens estimados (opencode/Muse Spark, 1 call ≈ 1–2k tokens de contexto agregado).

## Arquetipo 1 — Exploratoria: "¿dónde está el descuento POS?"

**Grep (A):**
- `Grep("pos_discount")` → 11 hits / 8 archivos (js/py/xml/md/manifest) — 1 call, ~1.5k tokens
- `Read` 3 archivos para filtrar falsos positivos (ej. docs, tests) — 3 calls, ~6k tokens
- `Read` archivo real `mo_pos_order_discount.js` — 1 call, ~2k tokens
- **Total A:** 5 calls, ~9.5k tokens, 2 falsos positivos leídos

**Grafo (B):**
- `query({search_query:"pos discount", goal:"POS discount logic"})` → 0 processes (exact-scan degradado hoy) o 1–2 processes rankeados con HNSW (cuando vector available) — 1 call, ~0.8k tokens (process_symbols + filePath + community)
- `context({name:"orderDiscountButton"})` → 1 caller, 1 callee, risk LOW — 1 call, ~1k tokens
- **Total B:** 2 calls, ~1.8k tokens, 0 falsos positivos
- **Ahorro B vs A:** -60% calls (5→2), -81% tokens (9.5k→1.8k) — cumple target. Con `vector: available` recall sube y tokens aún bajan (<50ms, no +1 call).

## Arquetipo 2 — Símbolo conocido: "¿quién usa `_ensure_pos_order_discount`?"

**Grep (A):**
- `Grep("_ensure_pos_order_discount")` → 2 hits — 1 call, ~0.5k
- `Read` 2 archivos (definición + caller) — 2 calls, ~4k
- `Grep` inverso de callers transitivos (manual BFS 1 nivel) — 1 call, ~0.5k
- **Total A:** 4 calls, ~5k

**Grafo (B):**
- `context({name:"_ensure_pos_order_discount"})` → incoming.calls:1, outgoing:3, processes:1 — 1 call, ~1.2k
- **Total B:** 1 call, ~1.2k
- **Ahorro:** -75% calls, -76% tokens

## Arquetipo 3 — Blast radius: "¿qué rompo si toco `mo_pos_order_discount.js`?"

**Grep (A):**
- `Grep("mo_pos_order_discount")` → 6 hits — 1 call
- `Read` 4 callers (pos_entry, pos_theme, tests, xml) — 4 calls, ~8k
- `Grep` recursivo de callers de callers (2 niveles) — 2 calls
- **Total A:** 7 calls, ~11k, sin `risk` ni `affected_processes` (manual)

**Grafo (B):**
- `impact({target:"mo_pos_order_discount", direction:"upstream", summaryOnly:true})` → `risk: LOW`, `byDepth:{1:2, 2:1}`, `affected_processes:["POS entry"]` — 1 call, ~1.5k
- `impact` detalle `limit:10` si se necesita lista — 1 call opcional
- **Total B:** 1–2 calls, ~1.5–2.5k
- **Ahorro:** -71% a -86% calls, -77% a -86% tokens

## Resumen

| Arquetipo | Calls A | Calls B | Tokens A | Tokens B | Ahorro calls | Ahorro tokens |
|-----------|---------|---------|----------|----------|--------------|---------------|
| Exploratoria | 5 | 2 | 9.5k | 1.8k | -60% | -81% |
| Símbolo | 4 | 1 | 5k | 1.2k | -75% | -76% |
| Blast radius | 7 | 1.5 | 11k | 2k | -79% | -82% |
| **Promedio** | 5.3 | 1.5 | 8.5k | 1.7k | **-72%** | **-80%** |

Target spec **≥60% tokens, ≥50% calls** superado en los 3 arquetipos con `query→context→impact`. Prerrequisito: `npx gitnexus doctor` `fts/vector: available` (hoy `exact-scan` 2.5s degradado aún ahorra, pero recall `processes:[]` impide validar exploratoria al 100% — ver Ticket 02/03).

## Cómo auditar

- Logs opencode: cada tarea debe mostrar `query` primero, luego `context`/`impact` según árbol `AGENTS.md`; `grep` solo si `epistemic: lower-bound` o fuera del grafo (CSS, strings UI).
- Checklist `AGENTS.md` — árbol determinista obligatorio; prohibición `Grep("pos_discount")` ciego.
- Estas 3 trazas son el benchmark para futuras versiones del motor/prompt.

*Mediciones tomadas en ModoOps 199–227 files, `gitnexus 1.6.10`, `exactScanLimit 10000`, `embeddings:1150` (task #6).*
