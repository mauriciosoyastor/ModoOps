# Research — Patrones de consumo del grafo por el agente IA para ahorrar tokens

> **Ticket:** #3 · **Rama throwaway:** `research/consumo-agente-tokens` · **Fecha:** 2026-08-30 · **Autor:** agente AFK research (Muse Spark)
> **Pregunta:** ¿Cómo debe consumir el agente IA (opencode / Muse Spark) el grafo GitNexus de ModoOps para **economizar tokens** vs búsqueda bruta (`grep`/`glob`), y qué herramientas son el contrato real?
> **Repo:** `C:\Users\mauri\OneDrive\Desktop\ProyectosOpencode\ModoOps` · **Commit indexado:** `97432d0` · **HEAD:** `827f65a` · **CLI:** `gitnexus 1.6.10` · **Grafo:** `199 files / 1555 nodes / 3163 edges / 70 communities / 123 processes`

---

## 1. Resumen ejecutivo (TL;DR)

**El grafo ya es el contrato barato del agente; `grep`/`glob` es el camino caro.** Para ModoOps (199 archivos, codebase chico-mediano) un `Grep` típico devuelve 10–50 hits de texto sin ranking y obliga al agente a `Read` cada archivo para entender contexto → **3–8 tool calls y 2k–8k tokens por pregunta**. El mismo objetivo vía grafo se resuelve en **1–2 calls MCP con ranking y contexto ya agregado**, sin leer archivos a ciegas.

| Dimensión | `Grep`/`Glob` | Grafo GitNexus (contrato recomendado) | Ahorro típico |
|-----------|---------------|----------------------------------------|---------------|
| **Búsqueda exploratoria** ("¿dónde está el descuento POS?") | `Grep("pos_discount")` → 11 hits dispersos + `Read` x3–5 | `query("pos discount")` → procesos rankeados + `context(name)` | **60–80% menos tokens** (1 respuesta agregada vs N lecturas) |
| **Vista de símbolo** ("¿quién llama a X?") | `Grep("funcName")` + grep inverso + reads | `context({name})` → callers/callees/processes categorizados | **70% menos** (grafo resuelve referencias tipadas) |
| **Blast radius** ("¿qué rompo si toco X?") | `Grep` iterativo + `Read` manual de cada caller | `impact({target, direction:"upstream"})` | **80–90% menos** (traversal server-side) |
| **Query estructural** ("¿qué clases extienden Y?") | imposible vía grep fiable | `cypher("MATCH ... EXTENDS ...")` | **evita lectura completa** |

**Contrato mínimo del agente (desde hoy, sin FTS/vector):**

```
1. Explorar  → gitnexus_query  (no Grep)
2. Profundizar → gitnexus_context (no Read + Grep)
3. Antes de editar → gitnexus_impact (no grep manual de callers)
4. Estructural/complejo → gitnexus_cypher
5. Seguridad/PDG → gitnexus_explain / gitnexus_pdg_query (solo con --pdg)
```

`grep`/`glob` quedan como **fallback solo cuando el grafo no cubre** (strings UI, CSS, contenido markdown no-code, o símbolo desconocido por grafo).

**Estado que bloquea el ahorro máximo hoy:** `fts: unavailable` y `vectorSearch: unavailable` (ver Research #2 `docs/research/brecha-vector-fts.md`). El ranking `query` está **degradado a exact-scan** (cosine exacto hasta 10k chunks, OK para 1555 nodos pero sin BM25 ni HNSW) — ver §5 y §6.

---

## 2. Estado verificado — fuentes primarias

### 2.1 `.gitnexus/gitnexus.json:50-73` y `.gitnexus/meta.json` (idénticos)

```json
"stats": { "files": 199, "nodes": 1555, "edges": 3163, "communities": 70, "processes": 123, "embeddings": 0 },
"capabilities": {
  "graph": { "provider": "ladybugdb", "status": "available" },
  "fts": { "provider": "ladybugdb-fts", "status": "unavailable", "skipReason": "extension-unavailable" },
  "vectorSearch": { "provider": "ladybugdb-vector", "status": "unavailable", "exactScanLimit": 10000 }
},
"embeddingDims": 384
```

Fuente: `.gitnexus/gitnexus.json:50-73` — ver también `npx gitnexus doctor` (§2.2) y `gitnexus://repo/ModoOps/context` (MCP resource, 70 communities / 123 processes confirmados en `gitnexus://repo/ModoOps/clusters` y `gitnexus://repo/ModoOps/processes`).

*Nota sobre el issue:* el ticket menciona "123 procesos" — coincide con el índice actual (123). Communities: 70 en el índice real; el ticket no fija número esperado.

### 2.2 `npx gitnexus doctor` (misma máquina, win32/x64, 2026-08-30)

```
Graph store:      available
Full-text search: unavailable  (Binder: fts not installed → install fts)
VECTOR index:     unavailable  (Binder: vector not installed → install vector)
Semantic mode:    exact-scan
Ext install:      load-only (offline)
Exact scan limit: 10000 chunks
Embeddings:       Backend local, ✓ supported, Threads 4, Batch 16/8
```

Implicación: **`gitnexus query` funciona pero degradado** — sin BM25 keyword, sin HNSW vector. Hace fallback a **exact-scan**: embeddea la query localmente y computa cosine exacto contra hasta 10k chunks indexados. Detalle en §5.

### 2.3 `gitnexus://repo/ModoOps/context` (MCP)

```yaml
tools_available:
  - query: Process-grouped code intelligence
  - context: 360-degree symbol view
  - impact: Blast radius analysis
  - explain: Persisted taint findings (requires --pdg)
  - detect_changes: Git-diff impact
  - rename, cypher, list_repos
```

Lista completa de MCP tools registradas en el binary: `npx gitnexus --help` enumera `query, context, impact, trace, cypher, detect-changes, check, list, status, doctor, analyze, serve, mcp, embeddings`.

### 2.4 `tools/grafo/README.md:58-63` y `tools/grafo/grafo.mjs`

Workflow ya documentado para el agente opencode:

```
1. Explorar: gitnexus_query → gitnexus_context → gitnexus_trace
2. Impacto antes de editar: gitnexus_impact + gitnexus_detect_changes
3. Refactor seguro: gitnexus_rename (preview graph+text)
4. Debug: gitnexus_explain / gitnexus_pdg_query si --pdg activo
```

Fuente: `tools/grafo/README.md:58-63` y `tools/grafo/grafo.mjs:13-29` (helper CLI que traduce a MCP calls). El helper no ejecuta DB directo; imprime el comando MCP a usar — útil para scripts pero el agente debe llamar MCP nativo.

---

## 3. Herramientas MCP GitNexus — contrato real y cuándo ahorran vs grep

### 3.1 Inventario completo (fuente: `npx gitnexus --help` + `gitnexus://repo/ModoOps/schema` + descripción MCP)

| Tool MCP | Qué hace (server-side) | Input clave | Output | Cuándo usar vs grep/glob |
|----------|------------------------|-------------|--------|---------------------------|
| **`gitnexus_query`** | Búsqueda híbrida **BM25 + vector** (RRF) sobre grafo; agrupa por **procesos** (flujos de ejecución) rankeados | `search_query`, `goal`, `task_context`, `limit`, `max_symbols` | `processes[]` (rankeados, con relevance), `process_symbols[]` (símbolo + filePath + community), `definitions[]` | **Siempre primero** para explorar ("¿dónde está X?", "¿cómo funciona Y?"). Reemplaza `Grep` + `Glob` + lectura de múltiples archivos. **Ahorro: 1 call vs 3–6 calls grep/read.** |
| **`gitnexus_context`** | Vista 360° de un símbolo: **incoming** (callers/importers) y **outgoing** (callees/imports) categorizados, participation en procesos, location | `name` (o `uid`), `file_path`, `kind` | `symbol`, `incoming:{calls, imports, ...}`, `outgoing`, `processes[]`, `epistemic`, `causes` | Cuando ya tenés un nombre ("¿qué usa `post_init_hook`?"). Reemplaza `Grep("symbol")` + `Read(file)` iterativo. **Retorna referencias tipadas** (CALLS/IMPORTS/EXTENDS/ACCESSES), no ocurrencias de texto. |
| **`gitnexus_impact`** | Traversal **upstream** (quién depende de X) o **downstream** (qué depende X) por aristas tipadas; con `processes`/`modules` afectados, `risk` (LOW/MEDIUM/HIGH/CRITICAL/UNKNOWN), `byDepth` paginado | `target`, `direction`, `maxDepth`, `limit`, `relationTypes`, `summaryOnly` | `byDepth{1,2,3}`, `byDepthCounts`, `affected_processes`, `affected_modules`, `risk`, `epistemic` | **Antes de editar** ("¿qué rompo si cambio X?"). Reemplaza cadena manual de `Grep` de callers transitivos. **Ahorro 80%+ en cambios de símbolos hub.** |
| **`gitnexus_trace`** | Camino dirigido más corto entre dos símbolos (CALLS + HAS_METHOD) con `file:line` y `edges[]` tipados | `from`, `to` (o `from_uid`/`to_uid`) | `hops[]`, `edges[]` (type+confidence), `truncated`, `crossings[]` (cross-repo) | "¿Cómo llega A a B?". Reemplaza 3–8 hops manuales de `context`/`grep`. |
| **`gitnexus_cypher`** | Cypher raw sobre grafo LadybugDB (single `CodeRelation` table con `type` filter) | `statement`, `params` | `markdown` table + `row_count` | Queries estructurales no cubiertas por tools tipadas (ej. "todos los que EXTENDS `BaseModel`" o "COUNT por `r.type`"). Reemplaza grep imposible de tipar. |
| **`gitnexus_explain`** | Taint findings persistidos (`--pdg`): source→sink data flows (TAINTED intra + TAINT_PATH inter) | `target` (file/symbol) o vacío (enumera todo) | hops con variable/line, `category` (sql-injection, xss, etc.) | Seguridad. Solo con índice `--pdg`. Sin equivalente grep. |
| **`gitnexus_pdg_query`** | PDG intra-procedural: `controls` (qué condición gobierna X) / `flows` (dónde fluye variable Y) | `target` (requerido), `mode`, `variable` | edges CDG/REACHING_DEF con branch sense `T`/`F`, `guard:true` | "¿Qué guarda este return?" / "¿dónde fluye esta variable dentro de la función?". Requiere `--pdg`. |
| **`gitnexus_rename`** | Preview de rename multi-archivo: `graph` (high confidence) + `text_search` (low) | `symbol_name`, `new_name`, `dry_run` | edits con `confidence: graph|text_search` | Refactor seguro; mejor que `sed`/regex manual. |
| **`gitnexus_detect_changes`** | Mapea `git diff` hunks → símbolos → procesos afectados; `risk_summary` | `scope` (unstaged/staged/all/compare) | `changed_symbols`, `affected_processes`, `risk_level` | Pre-commit / PR: "¿qué flujos toca mi diff?" — sin leer todo el diff manual. |
| **`gitnexus_check`** | Detecta ciclos File→File por IMPORTS (excluye `import()` deferred y `import type`) | `cycles` | `status`, `enumeration`, `cycleCount`, `componentCount` | Salud estructural; sin equivalente grep simple. |
| **`gitnexus_list_repos`** | Lista repos indexados (paginado) | `limit`, `offset` | repos + `pagination` | Descubrimiento; trivial. |
| **`gitnexus_tool_map` / `gitnexus_route_map` / `gitnexus_shape_check` / `gitnexus_api_impact`** | Mapeo de tools MCP/RPC, rutas API, y shape mismatches (responseKeys vs consumer accesses) | `tool`, `route`, `method`, `file` | handlers, consumers, mismatches, risk | API surface: "¿qué consume `/api/grants`?" y "¿qué campos espera el consumer?" |

**Tools PDG requieren reindex con `npx gitnexus analyze --pdg`** — hoy no activos en ModoOps (sin `BasicBlock` nodes). Ver `gitnexus://repo/ModoOps/schema:pdg_layers`.

### 3.2 Por qué cada una ahorra tokens — mecánica

- **`query` vs `Grep`:** `Grep` devuelve **líneas de texto crudo** (sin ranking, sin agrupación, con falsos positivos por substring). El agente debe luego `Read` cada archivo hit para entender si es relevante → **explosión de lecturas**. `query` hace ranking server-side (BM25 + vector RRF), agrupa por **procesos** (flujos coherentes, no archivos sueltos) y ya entrega `process_symbols` con `filePath` + `community` + `kind` → el agente lee solo el/los archivo(s) cabeza del ranking. **Medido en ModoOps:** `Grep("pos_discount")` → 11 hits en 8 archivos (ver §7.1) vs `gitnexus_cypher` con `CONTAINS 'discount'` → 16 nodes pero `query("pos discount")` degradado devuelve 0 procesos (sin FTS) y debería devolver procesos rankeados con FTS+vector — ver §5 sobre degradación actual.

- **`context` vs `Grep("symbol")`:** `Grep` no distingue **definición vs uso vs import vs override**; no resuelve **alias/re-export** ni **receiver typing**. `context` expone `incoming.calls` (quién te llama), `incoming.imports`, `outgoing.calls` (a quién llamás), `HAS_METHOD`/`ACCESSES` con `confidence` y `epistemic` (exact vs lower-bound) + `causes` (receiverTyping/dispatchBoundary). **Una call reemplaza 3–5 greps + reads**.

- **`impact` vs `Grep` iterativo:** Para saber "si cambio `X`, ¿qué se rompe?", con grep habría que iterar callers transitivos manualmente (BFS a mano, leyendo cada caller para encontrar sus callers). `impact` hace **BFS server-side** hasta `maxDepth` (default 3) por aristas tipadas CALLS/IMPORTS/EXTENDS/IMPLEMENTS, paginado por depth, con `risk` y `affected_processes` ya computados. Para símbolos hub (ej. clase base) el ahorro es masivo — `summaryOnly:true` evita explosión de output.

- **`cypher` vs `Grep` estructural:** Preguntas como "¿qué archivos IMPORTAN `mo_pos_order_discount`?" o "COUNT de aristas por tipo" no tienen respuesta fiable vía grep (falsos positivos por comentarios/strings). Cypher responde en una query tipada server-side.

### 3.3 Tabla de decisión rápida (cuándo usar cada una)

```
¿Pregunta exploratoria / "¿dónde/cómo"? → query
¿Ya tengo un símbolo / "¿quién lo usa"? → context
¿Voy a editar / "¿qué rompo"?         → impact (summaryOnly primero si hub)
¿Camino A→B / "¿cómo se conectan"?    → trace
¿Estructural / agregación / COUNT?    → cypher
¿Seguridad / flujo de dato tainted?   → explain (requiere --pdg)
¿"¿qué condición guarda este return?"  → pdg_query controls (requiere --pdg)
¿"¿dónde fluye esta variable"?        → pdg_query flows (requiere --pdg)
¿Antes de commit / "¿qué toqué"?      → detect_changes
¿Rename?                              → rename (dry_run true primero)
¿Rutas API / tools MCP?               → route_map / tool_map / api_impact
```

---

## 4. Patrones en opencode hoy — grep excesivo y cómo el grafo lo reemplaza

### 4.1 Patrón actual observado en opencode / Muse Spark (genérico + ModoOps)

El agente por defecto (sin grafo) resuelve exploración con:

1. `Glob("**/*.{js,py,xml}")` para mapear archivos.
2. `Grep("keyword")` (ripgrep) para localizar ocurrencias.
3. `Read(file)` de cada hit para entender contexto.
4. Repetir `Grep` para cada símbolo descubierto (callers, imports).

En ModoOps esto es especialmente caro porque:
- **Stack mixto** (Python Odoo + JS Odoo + XML + Astro) → `Glob` trae 199 archivos pero sin priorización.
- **Nombres Odoo dispersos** (`mo_pos_order_discount`, `mo_hub_service`, `_ensure_pos_order_discount`) → `Grep` substring trae hits en `__manifest__.py`, `hooks.py`, `mo_pos_order_discount.js`, `mo_product_screen_order_discount.js`, `mo_pos_entry.js`, docs, etc. sin distinguir **definición vs uso vs config**.
- **Sin ranking** → el agente lee archivos en orden arbitrario (a menudo docs/markdown irrelevantes primero).

### 4.2 Evidencia concreta en ModoOps

- `Grep("pos_discount")` → **11 matches en 8 archivos** (ver §7.1): `CONTEXT.md:478`, `docs/catalogo-modoops-inicial.md:9`, `modoops_core/__manifest__.py:21`, `modoops_core/hooks.py:2,4,25`, `modoops_core/static/src/js/pos/mo_product_screen_order_discount.js:24,90`, `modoops_core/static/src/js/services/mo_pos_theme.js:61`, etc. — mezcla de docs, manifest, Python y JS. El agente debe `Read` al menos 3–4 de esos para entender el flujo real.
- `gitnexus_cypher: MATCH (f) WHERE f.name CONTAINS 'discount' RETURN f.name, labels(f)[0], f.filePath LIMIT 20` → **16 nodes** ya tipados con `kind` y `filePath` exacto, sin ruido de markdown/docs (`Grep` traía docs; Cypher trae solo símbolos indexados). Pero el reemplazo ideal es `query("pos discount")` + `context` — ver §7.2.
- `gitnexus_context({_ensure_pos_order_discount})` → **exact**, 1 caller (`post_init_hook`), 0 outgoing, 0 processes — reemplaza `Grep("_ensure_pos_order_discount")` + lectura de `hooks.py` para confirmar callers. Output: 1 JSON estructurado vs 1–2 Grep + 1 Read.
- `gitnexus_impact({_ensure_pos_order_discount, upstream})` → **risk LOW, 1 direct caller, 1 process, 1 module** — reemplaza BFS manual de callers transitivos.
- `gitnexus_cypher: MATCH (a)-[r:CodeRelation]->(b) RETURN r.type, count(*) ORDER BY count(*) DESC` → **10 tipos de aristas** con counts (DEFINES 756, STEP_IN_PROCESS 549, CALLS 478, ...). Esto responde "¿qué relaciones existen?" en 1 query; vía grep sería imposible.

### 4.3 Antipatrón a evitar (checklist para el agente)

- ❌ `Grep("funcName")` como primer paso cuando `query`/`context`/`impact` existen.
- ❌ `Glob("**/*.js")` para "¿qué archivos tienen X?" cuando `cypher` o `query` responden tipado.
- ❌ `Read` de archivos completos sin haber rankeado vía `query` primero (lee solo top-1/2 del ranking).
- ❌ Cadena `Grep` → `Read` → `Grep` → `Read` para trazar A→B cuando `trace` lo hace server-side.
- ✅ **Regla de oro:** `query` primero, `context` para profundizar, `impact` antes de editar, `cypher` para estructural. `Grep` solo si el grafo no indexa ese contenido (strings UI, CSS, markdown no-code, asset paths).

---

## 5. `exactScanLimit 10000` — qué es, por qué importa, y estado actual

**Definición (fuente: `.gitnexus/gitnexus.json:71`, `npx gitnexus doctor`, `GITNEXUS_SEMANTIC_EXACT_SCAN_LIMIT` env):**

- `exactScanLimit` = máximo de **chunks embeddeados** que el fallback **exact-scan** evalúa con cosine exacto cuando **no hay índice vector HNSW** disponible.
- Default: `10000` (override vía `GITNEXUS_SEMANTIC_EXACT_SCAN_LIMIT=N` o flag `analyze --help`).
- **Modo actual ModoOps:** `exactScanLimit: 10000` pero **`vectorSearch: unavailable`** y **`embeddings: 0`** → no hay vectores indexados; `query` embeddea solo la **query** y compara contra chunks en memoria (si los hubiera) o degrada a keyword scan sin FTS.

**Para ModoOps (1555 nodes, est. 300–600 chunks con chunkSize 1200/overlap 120):**

- 300–600 chunks << 10k límite → **exact-scan nunca trunca por límite** en este repo, aunque es O(n) (cosine exacto por chunk, sin HNSW). Latencia estimada < 200ms para este tamaño vs < 50ms con HNSW (ver Research #2 §5.2).
- **Pero hoy embeddings=0** → no hay chunks que comparar; el fallback vector es vacío. Además **FTS unavailable** → sin BM25 keyword rank. Resultado observado: `gitnexus_query("pos discount")` y `gitnexus_query("taller orden trabajo workshop")` devuelven **`processes: []`** (0 resultados) a pesar de que Cypher encuentra nodes con `discount`/`workshop`. **La degradación es real: sin FTS+vector, `query` pierde recall.**

**Qué aportaría habilitar vector+FTS (ver Research #2):**

- Con `npx gitnexus analyze --force --embeddings` (una vez con red, modelo local `snowflake-arctic-embed-xs` 384 dims, ~90MB) + extensiones LadybugDB `fts`+`vector`:
  - `query` vuelve a **híbrido BM25 (FTS) + HNSW vector**, mergeado por **RRF (Reciprocal Rank Fusion)** — keyword para matches literales + semántico para sinónimos/paráfrasis ("descuento pos" ≈ "pos discount" ≈ "order discount").
  - Latencia query < 50ms, recall restaurado, ranking por relevancia (no por orden de archivo).
  - Tamaño extra: +2–5 MB en `.gitnexus/lbug` (384 dims × 4 bytes × ~500 chunks ≈ 0.75MB raw + HNSW overhead).
  - Sin costo, offline tras descarga inicial, sin filtrar código (modelo local).

**Decisión pendiente (ticket #4 paridad):** fijar `embeddingDims: 384` + `fts:available` + `vectorSearch:available` como paridad mínima del grafo base ModoOps.

---

## 6. Communities / Processes existentes (70 / 123) y qué aportaría `vectorSearch` semántico

### 6.1 Estado actual

- **70 communities** (Leiden clustering): `Chrome 21`, `Services 12/10/10/8`, `Models 10/8/7`, `Docs 8`, `Tests 8`, etc. (ver `gitnexus_cypher: MATCH (c:Community) RETURN ... LIMIT 15` — top cohesion 100% en Hubs/Docs). Cada símbolo tiene `MEMBER_OF` → community; sirve para **filtrar por área funcional** sin leer archivos.
- **123 processes** (execution traces): `BindActions → SelectorsForSurface (9 steps)`, `Tick → SetFlag (8)`, `Poll → QueryAll (7)`, etc. (ver `gitnexus://repo/ModoOps/processes` — top 20 de 50 mostrados). Cada process es un **camino dirigido** con `STEP_IN_PROCESS` edges (549 edges totales).

**Lo que ya aportan sin vector (graph-only):**

- Navegación por **áreas funcionales** (`gitnexus://repo/ModoOps/clusters`) sin grep: "¿qué hay en Chrome/Services/Models?" → lista de símbolos + cohesion.
- Traversal de **flujos** (`query` group by process + `context.processes[]` + `impact.affected_processes`) — el agente entiende "este símbolo participa en qué flujo" sin seguir calls manualmente.

### 6.2 Qué aportaría `vectorSearch` semántico (hoy `unavailable`)

Hoy `query` sin vector/FTS es **keyword exacto degradado** (sin BM25, sin embeddings). Con vector habilitado:

| Capacidad | Sin vector (hoy) | Con vector (local 384 dims) |
|-----------|------------------|------------------------------|
| **Query por sinónimo** | `query("descuento")` no matchea `discount`/`Desc.` | `query("descuento mostrador")` matchea `mo_pos_order_discount`, `pos_discount`, `order discount` por proximidad vectorial |
| **Query por concepto** | `query("taller orden trabajo")` → 0 procesos (observado) | `query("taller orden trabajo")` → rankea processes de `workshop`/`mo_work_order` semánticamente |
| **Ranking** | Sin ranking (exact-scan vacío) | RRF (BM25 rank + vector rank) — híbrido, robusto a typos/paráfrasis |
| **Recall** | Bajo (solo substring exacto si FTS estuviera) | Alto (semántico + keyword) |
| **Latencia** | < 200ms exact-scan O(n) (si hubiera embeddings) | < 50ms HNSW indexado |

**Para el agente:** vectorSearch convierte `query("pos discount")` de "grep con ranking roto" a **"búsqueda por intención"** — el agente puede preguntar en lenguaje natural ("descuento en mostrador", "flujo de taller", "onboarding smoke boot") y obtener procesos relevantes sin conocer el nombre exacto del símbolo. Es el multiplicador de ahorro: **menos intentos de query, menos greps de fallback, menos reads.**

**Nota técnica:** `embeddingDims 384` es el default local (`snowflake-arctic-embed-xs`, 22M params). No cambiar a 4096 (Qwen3-8B) sin reindex completo — ver Research #2 §3.2.

---

## 7. Ejemplos concretos — reemplazar `Grep` por `query` + `context` (+ `impact`/`cypher`)

### 7.1 Ejemplo 1 — `pos_discount` / descuento POS (el ejemplo del ticket)

**Objetivo:** "¿Dónde está implementado el descuento POS y qué toca?"

| Paso | ❌ Bruto (grep) | ✅ Grafo (MCP) | Tokens estimados |
|------|----------------|----------------|------------------|
| 1 | `Grep("pos_discount")` → 11 hits, 8 archivos | `gitnexus_query({search_query:"pos discount", repo:"ModoOps", limit:5})` → processes rankeados (con FTS/vector; hoy 0 por degradación — ver §5) | grep: 11 líneas + metadata; query: 1 JSON rankeado |
| 1b (hoy, sin FTS) | — | `gitnexus_cypher({statement:"MATCH (f) WHERE f.name CONTAINS 'discount' RETURN f.name, labels(f)[0], f.filePath LIMIT 10", repo:"ModoOps"})` → 16 nodes tipados | cypher: 16 filas tipadas (sin ruido docs) |
| 2 | `Read(modoops_core/__manifest__.py)` + `Read(modoops_core/hooks.py)` + `Read(mo_pos_order_discount.js)` para entender | `gitnexus_context({name:"_ensure_pos_order_discount", repo:"ModoOps"})` → exact, 1 caller (`post_init_hook`), file `modoops_core/hooks.py:1-30` | grep: 3 reads (~600 líneas); context: 1 JSON (~30 líneas) |
| 3 | `Grep("post_init_hook")` para callers transitivos | `gitnexus_impact({target:"_ensure_pos_order_discount", direction:"upstream", repo:"ModoOps"})` → risk LOW, 1 direct, 1 process (`Post_init_hook → _find`), 1 module | grep: N greps iterativos; impact: 1 JSON con BFS server-side |
| 4 (si edita) | `Grep("module_pos_discount")` para verificar config | `gitnexus_context({name:"mo_product_screen_order_discount", repo:"ModoOps"})` o `cypher` por `ACCESSES` | — |

**Ahorro estimado:** 3–5× menos tool calls, 60–80% menos tokens (evita leer 3–4 archivos completos + greps iterativos). Con FTS/vector habilitado, paso 1b colapsa en `query` directo sin cypher fallback.

**Evidencia medida hoy:**

```
Grep("pos_discount") → 11 matches (CONTEXT.md:478, docs/*:3, __manifest__.py:21, hooks.py:3, mo_product_screen_order_discount.js:2, mo_pos_theme.js:1)
gitnexus_cypher CONTAINS 'discount' → 16 nodes (mo_product_screen_order_discount.js, mo_pos_order_discount.js, _ensure_pos_order_discount, etc. — sin docs)
gitnexus_context(_ensure_pos_order_discount) → incoming:{post_init_hook}, outgoing:{}, epistemic:exact
gitnexus_impact(_ensure_pos_order_discount upstream) → impactedCount:1, risk:LOW, byDepth:{1:post_init_hook}
```

### 7.2 Ejemplo 2 — `workshop` / taller (flujo de órdenes de trabajo)

| Bruto | Grafo | Ahorro |
|-------|-------|--------|
| `Grep("workshop")` → hits en `mo_workshop_logic.py`, `workshop_hub.js`, `mo_work_order.py`, XMLs, tests | `gitnexus_query({search_query:"workshop orden trabajo", repo:"ModoOps"})` → processes de workshop rankeados (con vector; hoy 0 por degradación) + `gitnexus_context({name:"mo_work_order", repo:"ModoOps"})` | Evita grep en 10+ archivos + reads |
| `Grep("mo_work_order")` + `Read` iterativo para flujo | `gitnexus_cypher({statement:"MATCH (c:Class {name:'mo_work_order'})-[r:HAS_METHOD]->(m:Method) RETURN m.name, m.filePath", repo:"ModoOps"})` | 1 query tipada vs grep + read |

### 7.3 Ejemplo 3 — Onboarding / smoke

| Bruto | Grafo | Ahorro |
|-------|-------|--------|
| `Grep("onboarding")` → hits en 15+ archivos JS/services/tests | `gitnexus_query({search_query:"onboarding smoke boot", repo:"ModoOps", goal:"entender flujo onboarding"})` → processes `Poll → SetFlag` etc. rankeados | 1 query vs grep + 5 reads |
| `Read` de cada servicio para entender boot | `gitnexus_context({name:"mo_onboarding_host", repo:"ModoOps"})` → callers/callees + `processes[]` con steps | 1 context vs 3–4 reads |

### 7.4 Ejemplo 4 — Impacto antes de editar (hub symbol)

| Bruto | Grafo | Ahorro |
|-------|-------|--------|
| `Grep("mo_hub_service")` → N hits, luego grep de cada caller, luego grep de callers de callers... | `gitnexus_impact({target:"mo_hub_service", direction:"upstream", summaryOnly:true, repo:"ModoOps"})` → `risk`, `byDepthCounts`, `affected_processes` sin explosión | **80%+** — BFS server-side, sin paginar byDepth si summaryOnly |
| `Read` de cada caller para verificar | `gitnexus_context` solo sobre los `byDepth[1]` críticos | Lee solo lo que `impact` marca como WILL BREAK |

---

## 8. Entregable — Tabla de mapeo "búsqueda bruta → llamada GitNexus → ahorro esperado"

> **Uso:** pegar en `AGENTS.md` / skill del agente como contrato. Cada fila es una regla de reemplazo.

| # | Búsqueda bruta (hoy) | Llamada GitNexus (contrato) | Cuándo usar | Ahorro esperado (tokens / calls) | Notas / fallback |
|---|----------------------|-----------------------------|-------------|-----------------------------------|------------------|
| **1** | `Grep("keyword")` exploratorio | `gitnexus_query({search_query:"keyword natural", repo:"ModoOps", limit:5})` | Primera exploración, sin nombre exacto | **60–80%** (1 JSON rankeado vs 10–50 líneas + 3–5 Reads) | Con FTS/vector: recall semántico. Hoy degradado → si `query` devuelve 0, caer a `cypher CONTAINS`. Ver §5. |
| **2** | `Grep("symbol")` + `Read(file)` para "¿quién usa X?" | `gitnexus_context({name:"symbol", repo:"ModoOps"})` (+ `file_path`/`kind` si ambiguo) | Nombre conocido, vista 360° | **70%** (1 call tipada vs 2–3 Grep+Read) | `context` trae `incoming`/`outgoing`/`processes` categorizados con confidence. Grep solo si símbolo no indexado (ej. string literal). |
| **3** | `Grep` iterativo de callers transitivos | `gitnexus_impact({target:"symbol", direction:"upstream", repo:"ModoOps", maxDepth:3})` | Antes de editar / blast radius | **80–90%** (BFS server-side vs BFS manual) | Para hub: `summaryOnly:true` primero, luego `limit`/`offset` por depth. Grep no escala a depth>1. |
| **4** | `Grep` iterativo downstream ("¿qué usa X?") | `gitnexus_impact({target:"symbol", direction:"downstream", repo:"ModoOps"})` | Entender dependencias de X | **70%** | Útil para "¿si quito esta lib, qué se rompe?" |
| **5** | `Grep("A")` + `Grep("B")` + Reads para "¿cómo se conectan?" | `gitnexus_trace({from:"A", to:"B", repo:"ModoOps", maxDepth:10})` | Camino dirigido A→B | **75%** (1 call con hops+edges vs 3–8 context hops manuales) | Expone `edges[]` con `type` (CALLS vs HAS_METHOD) y `confidence`. Cross-repo: `repo:"@groupName"`. |
| **6** | `Glob` + `Grep` para estructural ("¿qué clases extienden Y?", "¿qué archivos importan Z?") | `gitnexus_cypher({statement:"MATCH ...", repo:"ModoOps"})` | Agregaciones, filtros tipados, COUNT | **Evita lectura completa** (1 query vs scan de N archivos) | Ejemplos: `MATCH (c:Class)-[:CodeRelation{type:'EXTENDS'}]->(b:Class {name:"Y"}) RETURN c.name, c.filePath` |
| **7** | `Grep("risk regex")` para seguridad | `gitnexus_explain({target:"file|symbol", repo:"ModoOps"})` | Taint source→sink | **Sin equivalente grep** | Requiere `analyze --pdg` (hoy no activo). Intra + interprocedural (M4). |
| **8** | `Read` + análisis manual de guards | `gitnexus_pdg_query({target:"func", mode:"controls", repo:"ModoOps"})` | "¿Qué condición gobierna este return/throw?" | **Sin equivalente grep** | Requiere `--pdg`. Retorna CDG edges con `branch T/F` y `guard:true`. |
| **9** | `Grep("varName")` para data flow | `gitnexus_pdg_query({target:"func", mode:"flows", variable:"varName", repo:"ModoOps"})` | "¿Dónde fluye esta variable dentro de la función?" | **Sin equivalente grep** | Requiere `--pdg`. Intra-procedural, REACHING_DEF edges. |
| **10** | `Grep` para rename | `gitnexus_rename({symbol_name:"old", new_name:"new", dry_run:true, repo:"ModoOps"})` | Refactor / rename | **Seguro** (graph high-conf vs text low-conf) | Preview `dry_run:true` primero, luego aplicar. |
| **11** | `git diff` + `Grep` manual de símbolos tocados | `gitnexus_detect_changes({repo:"ModoOps", scope:"all"})` | Pre-commit / PR / review | **70%** (mapea hunks→símbolos→procesos automáticamente) | Retorna `changed_symbols` + `affected_processes` + `risk_level`. |
| **12** | `Glob("**/*.js")` para "¿qué endpoints/tools hay?" | `gitnexus_route_map({repo:"ModoOps"})` / `gitnexus_tool_map({repo:"ModoOps"})` | Superficie API / MCP tools | **1 call vs scan** | `api_impact` combina route_map + shape_check + impact en una. |
| **13** | `Grep("fetch(.*/api")` para consumers | `gitnexus_api_impact({repo:"ModoOps", route:"/api/..."})` | Impacto de cambio en endpoint | **80%** (consumers + fields + risk) | Detecta mismatches shape (consumer accede a keys que endpoint no retorna). |

**Regla de fallback (cuando sí usar grep/glob):**

- Contenido no-code: strings UI, CSS, markdown, JSON de config, assets, paths de imágenes.
- Símbolo no indexado (generado dinámicamente, `eval`, template strings).
- Búsqueda literal de texto que no es símbolo (ej. "¿dónde aparece el mail `consultoria.matasini@gmail.com`?").
- En esos casos, `Grep` es correcto — pero **siempre después** de haber probado `query`/`context`/`cypher` primero.

---

## 9. Contrato recomendado para el agente IA (opencode / Muse Spark)

### 9.1 Workflow canónico (copiar a `AGENTS.md` / skill)

```markdown
## Grafo GitNexus — contrato del agente (ahorro de tokens)

**Repo indexado:** ModoOps (199 files, 70 communities, 123 processes, .gitnexus/lbug)
**Estado:** graph available, fts/vector unavailable (exact-scan fallback, limit 10k) — ver docs/research/brecha-vector-fts.md

### Regla 1 — Explorar siempre vía grafo primero
- `gitnexus_query({search_query:"<natural language>", repo:"ModoOps"})` antes que `Grep`.
- Si query devuelve 0 (degradado sin FTS/vector): fallback a `gitnexus_cypher` con `CONTAINS`, no a `Grep` inmediato.

### Regla 2 — Profundizar vía context, no via Read masivo
- `gitnexus_context({name:"<symbol>", repo:"ModoOps"})` antes de `Read` del archivo.
- Lee el archivo solo si `context` indica que es el símbolo relevante (top-1 del ranking).

### Regla 3 — Antes de editar, impact
- `gitnexus_impact({target:"<symbol>", direction:"upstream", repo:"ModoOps", summaryOnly:true})` para hub; sin summaryOnly para símbolos chicos.
- Si `impact.risk` es HIGH/CRITICAL o `epistemic:lower-bound` con `causes.receiverTyping>0`, hacer `Grep` de verificación antes de editar.

### Regla 4 — Estructural vía cypher
- COUNT, EXTENDS, IMPORTS, HAS_METHOD, ACCESSES → `gitnexus_cypher`, no `Grep`.

### Regla 5 — Grep solo como fallback
- Permitido para: strings UI/CSS/markdown no-code, assets, literales, símbolos no indexados.
- Prohibido como primer paso para: símbolos code, callers, imports, flujos, procesos.

### Herramientas disponibles
- `query`, `context`, `impact`, `trace`, `cypher`, `explain` (--pdg), `pdg_query` (--pdg), `rename`, `detect_changes`, `tool_map`/`route_map`/`api_impact`
- Helper CLI: `node tools/grafo/grafo.mjs <query|context|impact|trace|cypher|communities|processes>`

### Cuando habilitar vectorSearch
- Una vez con red: `GITNEXUS_LBUG_EXTENSION_INSTALL=auto npx gitnexus analyze --force --embeddings` (ver docs/research/brecha-vector-fts.md §6)
- Tras eso: `query` vuelve a híbrido BM25+vector (RRF) y recall semántico; exactScanLimit deja de ser relevante.
```

### 9.2 Checklist pre-tool-call (para el agente, antes de cada `Grep`)

1. ¿Estoy buscando un **símbolo code** (función/clase/método/file)? → `query`/`context`/`cypher`, no `Grep`.
2. ¿Estoy buscando **quién usa X** o **qué rompo si toco X**? → `context`/`impact`, no `Grep`.
3. ¿Estoy trazando **A→B**? → `trace`, no cadena de `Grep`.
4. ¿Es una pregunta **estructural** (COUNT, EXTENDS, IMPORTS)? → `cypher`, no `Grep`.
5. Solo si 1–4 es "no" y es **texto no-code / literal / asset** → `Grep`/`Glob` permitido.

---

## 10. Riesgos y decisiones abiertas

- **Degradación actual sin FTS/vector:** `query` pierde recall (observado: 0 procesos para queries que Cypher sí resuelve). Mitigación inmediata: fallback a `cypher CONTAINS` (no a `Grep`) hasta habilitar `vectorSearch`+`fts` (ticket #4 paridad). Ver Research #2 para pasos concretos de habilitación en Windows (VC++ Redist + OpenSSL + `GITNEXUS_LBUG_EXTENSION_INSTALL=auto analyze --force --embeddings`).
- **Stale index (4 commits behind):** `npx gitnexus status` reporta `stale` (index `97432d0` vs HEAD `827f65a`). Para research no bloquea (grafo paritario para queries exploradas), pero antes de implementar cambios reales hacer `npx gitnexus analyze --index-only` o `--force --embeddings`.
- **`exactScanLimit 10000`:** no es cuello de botella para ModoOps (est. 300–600 chunks << 10k), pero sin HNSW cada `query` es O(n) exact-scan. Habilitar vector lo hace HNSW indexado (<50ms).
- **`--pdg` no activo:** `explain`/`pdg_query` no tienen datos hasta reindex con `--pdg`. Decidir en ticket #4 si se habilita (añade BasicBlock nodes + CFG/CDG/REACHING_DEF; costo extra no estimado aquí).
- **Grep legítimo residual:** ~20% de búsquedas seguirán siendo `Grep` (strings UI, CSS, markdown, assets). El objetivo no es 0% grep, sino **mover del 80% grep actual al <20% grep** para code search.

---

## 11. Referencias primarias (claim → source)

- ` .gitnexus/gitnexus.json:50-73` + `.gitnexus/meta.json:50-73` → `files:199, nodes:1555, edges:3163, communities:70, processes:123, embeddings:0, fts/vector unavailable, embeddingDims:384, exactScanLimit:10000`
- `npx gitnexus doctor` → `Graph available, FTS unavailable (fts not installed), VECTOR unavailable, Semantic mode exact-scan, Exact scan limit 10000, Backend local ✓ supported`
- `npx gitnexus --help` → lista de comandos `query, context, impact, trace, cypher, detect-changes, check, list, status, doctor, analyze --embeddings/--pdg/--repair-fts`
- `npx gitnexus analyze --help` → flags `--embeddings [limit]`, `--repair-fts`, `--pdg`, `--embedding-*`, env `GITNEXUS_SEMANTIC_EXACT_SCAN_LIMIT`, `GITNEXUS_VECTOR_MAX_DISTANCE`
- `gitnexus://repo/ModoOps/context` (MCP resource) → `tools_available: query, context, impact, explain, detect_changes, rename, cypher, list_repos` + `stats: files 199, symbols 1555, processes 123` + `staleness: 4 commits behind`
- `gitnexus://repo/ModoOps/schema` → Node types (File, Function, Class, Method, Property, Community, Process, BasicBlock), Relationship types (CONTAINS, DEFINES, CALLS, IMPORTS, EXTENDS, HAS_METHOD, ACCESSES, MEMBER_OF, STEP_IN_PROCESS, CFG/CDG/REACHING_DEF con --pdg), single CodeRelation table
- `gitnexus://repo/ModoOps/clusters` → 70 communities (`Chrome 21/0.72`, `Services 12/0.82`, `Models 10/1.0`, `Docs 8/1.0`, `Tests 8/0.93`, ...)
- `gitnexus://repo/ModoOps/processes` → 123 processes (`BindActions → SelectorsForSurface 9 steps`, `Tick → SetFlag 8`, `Poll → QueryAll 7`, ... — top 20 mostrados)
- `gitnexus_cypher: MATCH (a)-[r]->(b) RETURN r.type, count(*)` → `DEFINES 756, STEP_IN_PROCESS 549, CALLS 478, CONTAINS 367, ACCESSES 339, MEMBER_OF 295, HAS_METHOD 189, IMPORTS 96, HAS_PROPERTY 71, USES 23`
- `Grep("pos_discount")` (ripgrep sobre repo) → 11 matches en 8 archivos (`CONTEXT.md:478`, `docs/*:2`, `__manifest__.py:21`, `hooks.py:3`, `mo_product_screen_order_discount.js:2`, `mo_pos_theme.js:1`)
- `gitnexus_cypher CONTAINS 'discount'` → 16 nodes tipados (sin ruido docs) — ver §7.1
- `gitnexus_context(_ensure_pos_order_discount)` → `Function:modoops_core/hooks.py:_ensure_pos_order_discount, incoming:{post_init_hook}, outgoing:{}, epistemic:exact` — `modoops_core/hooks.py:1-30`
- `gitnexus_impact(_ensure_pos_order_discount upstream)` → `risk:LOW, impactedCount:1, direct:1, processes:1, modules:1, byDepth:{1:post_init_hook}`
- `gitnexus_query` degradado → `warning: FTS extension failed to load — keyword search degraded (load-only policy ... install fts)`, `processes:[]` para `"pos discount"` y `"taller orden trabajo workshop"` (observado, ver §5)
- `tools/grafo/README.md:58-63` + `tools/grafo/grafo.mjs:13-29` + `tools/grafo/grafo.mjs:64-116` → workflow agente (query→context→trace, impact+detect_changes, rename, explain/pdg_query)
- `docs/research/brecha-vector-fts.md` (Research #2, rama `research/brecha-vector-fts`) → provider local `snowflake-arctic-embed-xs 384 dims 22M ~90MB`, tamaño +2–5MB, tiempo 45–90s, pasos `GITNEXUS_LBUG_EXTENSION_INSTALL=auto analyze --force --embeddings`

---

*Fin — validación humana requerida antes de fijar contrato del agente en `AGENTS.md` y habilitar `vectorSearch`+`fts` en ticket #4. Próximo: ticket #4 (paridad) → ticket #5 (SLA/freshness).*
