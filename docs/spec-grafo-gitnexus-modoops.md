# Spec — Grafo GitNexus ModoOps paritario para agente IA (economía de tokens)

> **Mapa:** [#1](https://github.com/mauriciosoyastor/ModoOps/issues/1) · **Estado:** spec lista para handoff (plan, no ejecución) · **Fecha:** 2026-08-30 · **Glosario:** `CONTEXT.md:276` `Grafo GitNexus ModoOps`

## 0. Destino

Spec cerrada para que **ModoOps (repo base)** disponga de grafo GitNexus **paritario al de un tenant/cliente** — `graph + FTS + vectorSearch/embeddings` habilitados, consumible por opencode/Muse Spark para reemplazar búsqueda bruta y economizar tokens — lista para ejecutar sin ambigüedad. Incluye paridad, contrato de consumo, métrica y evidencia empírica. **No incluye ejecutar** el reindex final `vector: available` dentro del Mapa (primer ticket de ejecución post-handoff).

---

## 1. Paridad exacta (decisión #4, Q1–Q5 aprobadas)

- **Capas:** `graph` (LadybugDB, ya `available`) + `FTS` (`ladybugdb-fts`) + `vectorSearch/embeddings` (`ladybugdb-vector`) **local offline** — modelo `Snowflake/snowflake-arctic-embed-xs` **384 dims congeladas** (~90 MB modelo, +2–5 MB índice). `embeddingDims 384` canónica en `gitnexus.json`; cambiar dims (ej. 4096 Qwen3) requiere ADR + reindex total.
- **PDG/taint (`--pdg`):** **fuera del MVP**, queda en fog. Añade `BasicBlock` + `CDG`/`REACHING_DEF` + `TAINTED`/`TAINT_PATH` (`pdg_query`/`explain`) pero es 60–90% de sobrecosto; se graduará si aparece caso taint con ticket nuevo.
- **Criterio de paridad (prueba binaria):**
  ```
  npx gitnexus doctor → graph: available, fts: available, vector: available, Semantic mode: vector
  + gitnexus.json → stats.embeddings>0 && capabilities.fts.status=="available" && capabilities.vectorSearch.status=="available" && embeddingDims==384
  + npx gitnexus query "pos discount" --repo ModoOps → processes rankeados (no `processes:[]`)
  ```
  Automatizable en CI.
- **Significado de paritario (Q2=A):** **plantilla reutilizable**, no instancia multi-DB hoy. Si un tenant futuro requiere grafo propio, se instancia el mismo spec (mismas capas/dims/criterio).

Fuentes: [#2](https://github.com/mauriciosoyastor/ModoOps/issues/2) (`docs/research/brecha-vector-fts.md`), [#4](https://github.com/mauriciosoyastor/ModoOps/issues/4).

---

## 2. Contrato de consumo del grafo por el agente IA (decisión #5, Q1–Q5 aprobadas)

- **Dónde vive el índice:** `.gitnexus/` **local por dev/VPS, `.gitignored` no versionado** (hoy `.git/info/exclude:.gitnexus`, migrar a `.gitignore` en ejecución). No se commitea (+30 MB DB mutable). Cada dev lo genera con `npx gitnexus analyze --force --embeddings` (una vez con red + `GITNEXUS_LBUG_EXTENSION_INSTALL=auto`, luego `load-only` offline).
- **MCP primario:** suite MCP directa `npx gitnexus mcp` → `query`/`context`/`impact`/`cypher`/`trace`/`detect_changes`/`check`/`list`. Sin wrappers (`tools/grafo/grafo.mjs` solo helper). Skill `gitnexus-guide`/`gitnexus-exploring` es solo instrucción de sistema (prompt).
- **Freshness / reindex / dueño:** **incremental manual a demanda** tras cada cambio relevante, dueño = dev que toca código. Comando `npx gitnexus analyze --embeddings` (o `--repair-fts`), chequeo `npx gitnexus doctor`. Sin hooks `post-commit`/`pre-push` ni nightly (overkill para 199 files / 14–60s, ver §4).
- **Degradación controlada:** cascada **Grafo → exact-scan (auto, `exactScanLimit 10000`) → `grep`/`glob`**. `grep` solo si `context` no resuelve símbolo (CSS/UI strings, markdown) o `epistemic: lower-bound` por `receiverTyping`/`dispatchBoundary`. Así se explota ahorro 60–90% incluso degradado.
- **Árbol determinista del agente (obligatorio en `AGENTS.md:§9`):**
  ```
  exploratorio → query
  nombre conocido → context
  previo a editar → impact (summaryOnly primero en hubs)
  A→B → trace
  estructural/COUNT → cypher
  pre-commit → detect_changes
  ```
  **Prohibir** `Grep("pos_discount")` ciego cuando el símbolo existe en el grafo — guardarraíl contra inercia LLM.

Fuentes: [#3](https://github.com/mauriciosoyastor/ModoOps/issues/3) (`docs/research/consumo-agente-tokens.md`), [#5](https://github.com/mauriciosoyastor/ModoOps/issues/5).

---

## 3. Métrica de economía de tokens y criterio de aceptación (decisión #7, Q1–Q4 aprobadas)

- **Q1 Baseline por arquetipos canónicos:** muestreo de **3 tareas** — (1) exploratoria "¿dónde está descuento POS?", (2) vista símbolo "¿quién llama a X?", (3) blast radius "¿qué rompo si toco X?" — cada una medida **2 veces**: `grep/glob + Read` iterativo vs `query→context→impact`. Contar **tool calls + tokens** reportados por opencode/Muse Spark (latencia + facturación real). Comparar contexto estructurado vs parsing texto plano.
- **Q2 Target:** **≥60% menos tokens y ≥50% menos tool calls** vs baseline grep para las 3 tareas **cuando** `query` no cae a `processes:[]`. Condición crítica: **prerrequisito** `doctor` `fts: available` + `vector: available` (`Semantic mode: vector`) — sin HNSW/BM25 el recall está degradado (visto en #6: `query "pos discount"` → `[]` en exact-scan 2.5s).
- **Q3 Trazabilidad determinista:** auditar vía **logs + `AGENTS.md:§9`**. Regla `query → context → impact` restringe `grep` a fallbacks epistémicos o fuera del grafo (CSS/templates). Las **3 trazas de ejemplo** del handoff sirven como benchmark para futuras versiones del motor/prompt.
- **Q4 Salida del Mapa y handoff limpio:** este spec (`docs/spec-grafo-gitnexus-modoops.md`) con **5 puntos** — (a) paridad, (b) contrato MCP/fallback, (c) métricas ahorro, (d) evidencia empírica, (e) glosario `CONTEXT.md:276` — es la **spec terminada y auditable**. **Desacoplada** de la ejecución del reindex `vector: available`, que queda como **primer ticket de ejecución técnica** post-Mapa (evita dilatar cierre arquitectónico).

Fuentes: [#7](https://github.com/mauriciosoyastor/ModoOps/issues/7).

---

## 4. Evidencia empírica — validación Windows (task #6)

Entorno: `win32/x64`, `Node v24.12.0`, `gitnexus 1.6.10`, `LadybugDB 0.19.1`, `pool 2048 MiB`, `ONNX 1.29.0`.

- **Graph puro** (`--force`, `GITNEXUS_LBUG_EXTENSION_INSTALL=never`): `Repository indexed successfully (14.4s)`, wall 47s, **1733 nodes / 3435 edges / 74 clusters / 137 flows**, `.gitnexus/` **26 MB**, `fts/vector: unavailable`, `exact-scan`.
- **Con embeddings** (`--force --embeddings`, `auto`): `Repository indexed successfully (217.1s)`, wall 247s — incluye 30s timeout instalación extensiones (`FTS install timed out after 15000ms` ×2), descarga modelo, generación **1150 embeddings**, `.gitnexus/` **37.62 MB** (+11.6 MB), `~/.cache/huggingface` **107.6 MB** (5 archivos, modelo ~90 MB). `Semantic embeddings were generated without VECTOR index; queries will use exact-scan fallback`. `doctor` sigue `fts/vector: unavailable`, `Semantic mode: exact-scan`, `Backend: local ✓ supported`.
- **Query latencia (exact-scan degradado):** `npx gitnexus query "pos discount" --repo ModoOps` → `processes:[]` (recall bajo sin BM25), **2.54s** primera (model load cpu), esperada <50ms híbrida con HNSW.
- **Implicación:** reindex incremental tras primera vez <60s sin descarga; paridad completa FTS/vector requiere reintento con red estable (no timeout) hasta `doctor` `available` o `pre-install offline`; VC++ Redist/OpenSSL no bloqueó (no error 126).

Fuente: [#6](https://github.com/mauriciosoyastor/ModoOps/issues/6).

---

## 5. Glosario y ADR

- **Grafo GitNexus ModoOps** — `CONTEXT.md:276` añadida (commit `5c25201`): índice local `.gitnexus/` graph+FTS+vector 384d, consumo MCP `query→context→impact→cypher`, offline-first, reindex `analyze --force --embeddings`, criterio paridad, sin `--pdg` MVP, plantilla por tenant.
- Sin ADR en este Mapa (decisiones reversibles con reindex; sorprenderían poco).

---

## 6. Checklist de aceptación del spec (handoff)

- [x] Paridad 384d congelada + PDG fuera MVP (#4)
- [x] Contrato MCP local, árbol determinista, degradación Grafo→exact-scan→grep (#5)
- [x] Métrica arquetipos 60%/50% con prerrequisito `doctor` available (#7)
- [x] Evidencia empírica 14.4s/217s, 1150 embeddings, 37MB/108MB, timeout extensiones documentado (#6)
- [x] Glosario `CONTEXT.md:276` actualizado (#4)

**Primer ticket de ejecución post-handoff (no bloquea cierre):** reintentar con red estable `GITNEXUS_LBUG_EXTENSION_INSTALL=auto npx gitnexus analyze --force --embeddings` hasta `doctor` `fts/vector: available` + `Semantic mode: vector` + query smoke, luego actualizar `AGENTS.md:§9` con árbol y migrar `.gitnexus/` de `.git/info/exclude` a `.gitignore`.

---

*Handoff listo — Wayfinder plan completo, 6/6 decisiones cerradas, 0 fog pendiente, 0 out-of-scope nuevo.*
