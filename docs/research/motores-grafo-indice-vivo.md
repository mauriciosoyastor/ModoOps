# Research — Motores OSS de grafo / code intelligence con índice vivo

> **Fecha:** 2026-09-24 · **Autor:** agente research · **Repo:** `C:\Users\mauri\ProyectosOpencode\ModoOps`  
> **Pregunta:** ¿Qué motores open-source de **code knowledge graph / code intelligence** mantienen (o pueden mantener) el índice **continuamente fresco** mientras el desarrollador crea, modifica y borra código — vía file watchers, hooks, reparse incremental, invalidación de dependientes dirty, etc.? Comparar candidatos aptos para **reemplazar GitNexus** como backend de un agente de coding (Cursor MCP preferido) en un repo polyglot (TypeScript/Astro + Python).  
> **Alcance:** research only — no implementar, no spike, no grill. Evaluación contra fuentes primarias (README/docs/source oficiales).

---

## 1. Veredicto (TL;DR)

Para **índice vivo en sesión de agente** (edits locales → grafo usable en segundos, MCP en Cursor, TS+Python), el mercado OSS se parte en tres bandas:

| Banda | Qué hace bien | Limitación clave |
|---|---|---|
| **Tree-sitter + SQLite + watcher/hooks** | Reparse O(changed files); MCP stdio; encaja en Cursor | Fidelidad semántica menor que typechecker/LSP/SCIP |
| **SCIP / CKB** | Índice “compiler-grade”; MCP/daemon documentados | “Incremental” = **import DB**; la generación SCIP sigue siendo **full-project** |
| **Kythe / extractores de build** | Interop industrial, grafo de hechos | No es watcher de sesión; pipeline de extract + index |

**Shortlist para un grill-with-docs posterior (2–3):**

1. **[code-review-graph](https://github.com/tirth8205/code-review-graph)** — hooks + `watch` + `crg-daemon`, SQLite, `install --platform cursor`, **Astro** explícito (grammar TS), Python+TS, invalidación de dependientes vía edges de import/call. Mejor fit documental al stack ModoOps.
2. **[code-graph-mcp](https://github.com/sdsrss/code-graph-mcp)** (`@sdsrs/code-graph`) — Merkle + FS watcher, dirty propagation a callers, MCP Cursor vía `npx`, TS/Python “Full”, binario Rust. Sin Astro en la tabla oficial de lenguajes.
3. **[codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)** (upstream; el link `utafrali/…` es un **fork**) — auto-sync por **polling** mtime+size, binarios Windows, `install` detecta Cursor. Frescor “vivo” con latencia de poll (1–60 s), no fsnotify.

**Fuera del shortlist para “índice vivo de sesión”:** CKB (caveat SCIP), Kythe (build-time), SCIP solo (formato/indexers, sin MCP de sesión), `asd-noor/codemap` / `isink17/codegraph` (candidatos secundarios: young/small, CGo, sin Astro documentado).

---

## 2. Fuentes primarias

| # | Fuente | Qué aporta (qué “own”) |
|---|---|---|
| 1 | [tirth8205/code-review-graph README](https://raw.githubusercontent.com/tirth8205/code-review-graph/main/README.md) | Tree-sitter, incremental SHA-256, hooks/watch/daemon, SQLite, languages incl. Astro, MCP |
| 2 | [code-review-graph `docs/USAGE.md`](https://raw.githubusercontent.com/tirth8205/code-review-graph/main/docs/USAGE.md) | `install --platform cursor` → `.cursor/mcp.json`; `watch`; platforms |
| 3 | [sdsrss/code-graph-mcp README](https://raw.githubusercontent.com/sdsrss/code-graph-mcp/main/README.md) | Merkle watcher, dirty propagation, SQLite+sqlite-vec, MCP Cursor, language tiers |
| 4 | [isink17/codegraph README](https://raw.githubusercontent.com/isink17/codegraph/master/README.md) | `update` / `watch`, SQLite, MCP Cursor, 12 langs tree-sitter, Windows `%AppData%` |
| 5 | [asd-noor/codemap README](https://raw.githubusercontent.com/asd-noor/codemap/master/README.md) (`codefinder` renombra a **CodeMap**) | fsnotify 500 ms, daemon idle 5 min, Tree-sitter + LSP, SQLite WAL |
| 6 | [DeusData/codebase-memory-mcp README](https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/README.md) | Auto-sync polling, incremental content-hash, Windows zip + setup.ps1, Cursor |
| 7 | [api.github.com `utafrali/codebase-memory-mcp`](https://api.github.com/repos/utafrali/codebase-memory-mcp) | Confirma **fork** de DeusData (0 stars en el fork) |
| 8 | [CKB Incremental Indexing](https://codeknowledge.dev/docs/Incremental-Indexing) | Caveat: SCIP siempre full-project; incremental = DB import + transitive invalidation |
| 9 | [codeknowledge.dev home](https://codeknowledge.dev/) | MCP + CLI + HTTP + daemon; Cursor listado; `ckb setup` |
| 10 | [kythe/kythe README.adoc](https://raw.githubusercontent.com/kythe/kythe/master/README.adoc) | Indexers C++/Go/Java; extractors build; no session-watch |
| 11 | [kythe.io overview](https://kythe.io/docs/kythe-overview.html) | Hub L×C×B; grafo de hechos; non-goals |
| 12 | [sourcegraph/scip-typescript README](https://raw.githubusercontent.com/sourcegraph/scip-typescript/main/README.md) | Indexer TS/JS via typechecker; comando `scip-typescript index` (proyecto entero) |
| 13 | [sourcegraph/scip README](https://raw.githubusercontent.com/sourcegraph/scip/main/README.md) | Protocolo SCIP; lista de indexers (incl. scip-python) |
| 14 | [Sourcegraph SCIP announce](https://about.sourcegraph.com/blog/announcing-scip) | Motivación vs LSIF; incremental indexing como **plan futuro** (2022) |
| 15 | [api.github.com repos](https://api.github.com/) (tirth8205, sdsrss, DeusData, kythe, isink17, asd-noor) | Stars/forks/default_branch al 2026-09-24 |

**Secundarias (comunidad, solo después de claims primarios):**

| # | Fuente | Rol |
|---|---|---|
| A | [HN #47314090](https://news.ycombinator.com/item?id=47314090) | Show HN code-review-graph (autor + 1 comment install fail) |
| B | [HN #47222316](https://news.ycombinator.com/item?id=47222316) | Show HN vexp.dev (grafo tree-sitter + SQLite; producto, no el shortlist) |
| C | [HN #47211486](https://news.ycombinator.com/item?id=47211486) | Show HN Code-Graph-RAG (Memgraph + MCP; 11 langs) |

---

## 3. Matriz de comparación

Leyenda frescor: **true-incr** = reparse solo archivos dirty; **poll** = sync periódico; **db-incr** = import DB selectivo con SCIP full; **build** = extract/index de compilación; **UNKNOWN** = no documentado en fuentes leídas.

| Candidato | Modelo de update | Storage | Langs (TS / Py / Astro) | MCP / Cursor | Windows | Watch / hooks | Fidelidad |
|---|---|---|---|---|---|---|---|
| **code-review-graph** | true-incr (SHA-256) + dependents | SQLite en `.code-review-graph/` | Sí / Sí / **Sí** (TS grammar) | Sí; `install --platform cursor` | Docs Windows MCP (`PYTHONUTF8`, `.exe`) | Hooks + `watch` + `crg-daemon` | Tree-sitter (+ framework enrich) |
| **code-graph-mcp** | true-incr (BLAKE3 Merkle) + dirty callers | SQLite + FTS5 + sqlite-vec | Full / Full / **No** listado | Sí; `~/.cursor/mcp.json` + npx | Paths `%LOCALAPPDATA%` para modelos | FS watcher; `start_watch`; PostToolUse (Claude plugin) | Tree-sitter (name-resolve limits) |
| **isink17/codegraph** | true-incr `update` + `watch` | `codegraph.sqlite` | Sí / Sí / **No** | Sí; `codegraph install` Cursor | `%AppData%\codegraph\` | `codegraph watch` | Tree-sitter (12 langs) |
| **asd-noor/codemap** | true-incr por archivo (watcher) | SQLite WAL | Sí / Sí / **No** | Sí (`serve` stdio) | UNKNOWN (solo tip Linux inotify) | fsnotify 500 ms; daemon 5 min idle | Tree-sitter **+ LSP** refs/impl |
| **codebase-memory-mcp** | true-incr content-hash + **poll** | SQLite `~/.cache/…` | Sí / Sí / **No** (35 langs; no Astro) | Sí; install detecta Cursor | Binary `windows-amd64` + setup.ps1 | Auto-sync poll 1–60 s (no FS event) | Tree-sitter |
| **CKB** | **db-incr** (+ transitive queue); SCIP gen **siempre full** | DB propia (docs) | TS/JS/Py sí (incremental langs) / Astro UNKNOWN | Home: MCP + daemon; Cursor listado | UNKNOWN en Incremental-Indexing | watch + daemon mencionados; poll intervals | **SCIP** (+ LSP/git en marketing home) |
| **Kythe** | build extract → index | artefacto Kythe | C++/Go/Java indexers | No MCP de agente | UNKNOWN | No session-watch | Compilación / schema Kythe |
| **SCIP / scip-typescript** | Full project index CLI | `index.scip` | TS/JS sí; Py vía scip-python | No (formato) | UNKNOWN | No | Typechecker / compiler plugins |

---

## 4. Deep dive por candidato

### 4.1 code-review-graph (`tirth8205/code-review-graph`)

**Claims (primarias):**

- Construye mapa estructural con **Tree-sitter**, lo actualiza **incrementalmente**, sirve contexto compacto por **MCP** ([README](https://raw.githubusercontent.com/tirth8205/code-review-graph/main/README.md)).
- Updates: hooks, pre-commit y **watch mode**; diff de changed files; dependents vía import/call edges; re-parse solo si cambió **SHA-256**; ~2.5 s para edit de 2 archivos en ~3k files (django), de los cuales ~1.4 s startup ([README §Incremental updates](https://raw.githubusercontent.com/tirth8205/code-review-graph/main/README.md)).
- Lenguajes: Python, JS/TS/TSX, … **Astro** (“parsed with the TypeScript grammar”), Vue/Svelte, notebooks, etc. ([README](https://raw.githubusercontent.com/tirth8205/code-review-graph/main/README.md); [USAGE.md](https://raw.githubusercontent.com/tirth8205/code-review-graph/main/docs/USAGE.md)).
- Storage: **un SQLite** en `.code-review-graph/` ([README](https://raw.githubusercontent.com/tirth8205/code-review-graph/main/README.md)).
- Cursor: `code-review-graph install --platform cursor` → `.cursor/mcp.json` ([USAGE.md](https://raw.githubusercontent.com/tirth8205/code-review-graph/main/docs/USAGE.md)). Nota: USAGE dice que Cursor **no** tiene hooks de editor como Claude/Codex; para eso recomienda **`crg-daemon`** / `watch` ([README §daemon](https://raw.githubusercontent.com/tirth8205/code-review-graph/main/README.md)).
- Windows: troubleshooting MCP JSON/EOF — usar `.exe` directo + `PYTHONUTF8=1` ([README](https://raw.githubusercontent.com/tirth8205/code-review-graph/main/README.md)).
- API stars 2026-09-24: **31766** ([api](https://api.github.com/repos/tirth8205/code-review-graph)) — cifra alta para repo creado 2026-02; tratar como señal cruda de API, no como calidad.

**Fit ModoOps:** alto en stack (Astro+TS+Py), Cursor, frescor continuo vía daemon/watch aunque Cursor no instale hooks.

---

### 4.2 code-graph-mcp (`sdsrss/code-graph-mcp`)

**Claims:**

- **Incremental indexing**: Merkle tree BLAKE3; FS watcher; filtra chmod/xattr; dirty propagation regenera contexto de callers cross-file ([README](https://raw.githubusercontent.com/sdsrss/code-graph-mcp/main/README.md)).
- Perf propia (repo del proyecto, release build): full index ~2.0 s; incremental noop ~28 ms ([README](https://raw.githubusercontent.com/sdsrss/code-graph-mcp/main/README.md)).
- Storage: SQLite + FTS5 + sqlite-vec; `.code-graph/index.db` ([README §Storage](https://raw.githubusercontent.com/sdsrss/code-graph-mcp/main/README.md)).
- MCP: Cursor/Windsurf ejemplo `npx -y @sdsrs/code-graph` en `~/.cursor/mcp.json` ([README](https://raw.githubusercontent.com/sdsrss/code-graph-mcp/main/README.md)).
- Tools: `start_watch` / `stop_watch` / `get_index_status` (aliases ocultos) ([README](https://raw.githubusercontent.com/sdsrss/code-graph-mcp/main/README.md)).
- Languages **Full**: TS/TSX, JS, Go, Python, Rust, Java. **No** aparece Astro/Vue/Svelte en la tabla de 19 lenguajes ([README](https://raw.githubusercontent.com/sdsrss/code-graph-mcp/main/README.md)).
- Windows: documentado para path de modelos embeddings (`%LOCALAPPDATA%\code-graph\…`) y quirk de `tar -C` ([README](https://raw.githubusercontent.com/sdsrss/code-graph-mcp/main/README.md)). Soporte runtime del watcher en Win: **no** hay disclaimer negativo en README; asumir “mencionado parcialmente” → grill debe smoke-testear.
- Fidelidad: resolución de calls por nombre; documenta límites (path-qualified methods, receivers ambiguos) ([README](https://raw.githubusercontent.com/sdsrss/code-graph-mcp/main/README.md)).
- Stars API: **78** ([api](https://api.github.com/repos/sdsrss/code-graph-mcp)).

**Fit ModoOps:** fuerte en TS/Python + watcher real; gap Astro/SFC; licencia MIT; madurez menor en stars que CRG.

---

### 4.3 isink17/codegraph

**Claims:**

- Index local SQLite; tree-sitter 12 langs (Go, Python, TS/JS, …); **incremental updates**; **file watching**; `codegraph install` Claude/Cursor/Windsurf/Gemini ([README](https://raw.githubusercontent.com/isink17/codegraph/master/README.md)).
- CLI: `codegraph update`, `codegraph watch`, `codegraph serve` ([README](https://raw.githubusercontent.com/isink17/codegraph/master/README.md)).
- Arquitectura: `internal/watcher` “File watch and debounced updates” ([README](https://raw.githubusercontent.com/isink17/codegraph/master/README.md)).
- Windows config path: `%AppData%\codegraph\config.json` ([README](https://raw.githubusercontent.com/isink17/codegraph/master/README.md)).
- Requiere Go 1.23+ y **C compiler** (CGo/tree-sitter) ([README](https://raw.githubusercontent.com/isink17/codegraph/master/README.md)).
- Licencia **FSL-1.1-MIT** (no MIT puro) ([README](https://raw.githubusercontent.com/isink17/codegraph/master/README.md)).
- Stars API: **3** ([api](https://api.github.com/repos/isink17/codegraph)). Sin Astro en tabla.

**Fit:** candidato de respaldo técnico (watch+MCP+Windows path); riesgo adopción/licencia/comunidad.

---

### 4.4 CodeMap (`asd-noor/codefinder` → `asd-noor/codemap`)

**Claims:**

- GitHub `asd-noor/codefinder` **redirige** al repo `asd-noor/codemap` ([api](https://api.github.com/repos/asd-noor/codefinder)).
- Tree-sitter + **LSP enrichment** (gopls, pylsp, typescript-language-server, …); SQLite WAL; MCP 6 tools ([README](https://raw.githubusercontent.com/asd-noor/codemap/master/README.md)).
- **Real-time:** watcher 500 ms debounce; `codemap watch` daemon con **5 min idle timeout**; architecture `fsnotify` ([README](https://raw.githubusercontent.com/asd-noor/codemap/master/README.md)).
- Languages: Go, Python, JS/TS, Lua, Zig, Templ — **sin Astro** ([README](https://raw.githubusercontent.com/asd-noor/codemap/master/README.md)).
- Troubleshooting documenta `inotify: too many open files` (**Linux**); Windows: **UNKNOWN** ([README](https://raw.githubusercontent.com/asd-noor/codemap/master/README.md)).
- CGo + Go 1.25.6+; GPL-3.0 ([README](https://raw.githubusercontent.com/asd-noor/codemap/master/README.md); [api](https://api.github.com/repos/asd-noor/codemap) license GPL-3.0).
- Stars: **1**.

**Fit:** interesante por híbrido AST+LSP (fidelidad refs), pero GPL, madurez mínima, Astro ausente, Windows no documentado.

---

### 4.5 codebase-memory-mcp (upstream DeusData; fork utafrali)

**Claims:**

- `utafrali/codebase-memory-mcp` es **fork** de `DeusData/codebase-memory-mcp` ([api fork](https://api.github.com/repos/utafrali/codebase-memory-mcp)). Toda claim de producto se cita al **upstream**.
- Tree-sitter; 35 languages (lista incluye TS/TSX/Python; **no** Astro) ([README](https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/README.md)).
- **Auto-sync:** background watcher **polls** mtime+size; intervalo adaptativo 1 s–60 s; incremental content-hash; no bloquea queries ([README §Auto-Sync](https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/README.md)).
- CLI mode **no** arranca watcher ([README](https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/README.md)).
- Windows: release `windows-amd64.zip`, SmartScreen note, `setup-windows.ps1`; build from source MSYS2/WSL ([README](https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/README.md)).
- `install` auto-detecta Claude, Codex, **Cursor**, Windsurf ([README](https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/README.md)).
- Stars API upstream: **44813** ([api](https://api.github.com/repos/utafrali/codebase-memory-mcp) parent) — otra cifra extrema; reportar y no sobre-interpretar.

**Fit:** buen “live enough” en Windows + Cursor; frescor con latencia de poll (no event-driven). Útil si se prioriza binary zero-deps sobre watcher nativo.

---

### 4.6 CKB (Code Knowledge Backend) — Incremental Indexing

**Claims críticas (no diluir):**

> “The SCIP indexer always runs on your entire codebase. […] What CKB optimizes is the database import step.”  
> — [Incremental Indexing](https://codeknowledge.dev/docs/Incremental-Indexing)

- Flujo: change detection (`git diff`) → full SCIP gen → selective DB import → transitive invalidation v2 ([docs](https://codeknowledge.dev/docs/Incremental-Indexing)).
- Incremental disponible para Go, TS/JS, Python, Dart, Rust (v7.5+); otros full reindex ([docs](https://codeknowledge.dev/docs/Incremental-Indexing)).
- Reverse refs / callers pueden quedar stale en modo lazy hasta `--force` o drain eager ([docs](https://codeknowledge.dev/docs/Incremental-Indexing)).
- Docs sugieren watch con **poll intervals** más largos y **daemon** para amortizar ([docs](https://codeknowledge.dev/docs/Incremental-Indexing)).
- Home: MCP, CLI, HTTP, background daemon; agentes Cursor/Claude/…; `npm i -g @tastehub/ckb` ([codeknowledge.dev](https://codeknowledge.dev/)).
- Windows en Incremental-Indexing: **UNKNOWN**.

**Fit:** excelente si se quiere fidelidad SCIP y se tolera 10–60 s+ de SCIP full por refresh; **no** sustituye un watcher tree-sitter de ~segundos para edits locales frecuentes.

---

### 4.7 Kythe (`kythe/kythe`; `google/kythe` apunta al mismo ecosistema)

**Claims:**

- Ecosistema pluggable language-agnostic; indexers **C++, Go, Java**; extractors javac/Maven/cmake/Go/Bazel; sample xref service ([README.adoc](https://raw.githubusercontent.com/kythe/kythe/master/README.adoc)).
- Overview: hub para tools/build/editors; grafo de hechos; **non-goals** incluyen no ser IR de compilador ([kythe.io overview](https://kythe.io/docs/kythe-overview.html)).
- No documenta MCP Cursor ni file-watcher de working tree en las fuentes leídas.
- Stars: **2158** ([api](https://api.github.com/repos/kythe/kythe)).

**Fit:** referencia industrial / formato de hechos; **no** candidato a “índice vivo de sesión Cursor” para ModoOps.

---

### 4.8 SCIP + scip-typescript

**Claims:**

- SCIP = protocolo de indexación (Protobuf); indexers incluyen scip-typescript, scip-python, etc. ([scip README](https://raw.githubusercontent.com/sourcegraph/scip/main/README.md)).
- `scip-typescript index` opera sobre proyecto con `tsconfig.json` / workspaces ([scip-typescript README](https://raw.githubusercontent.com/sourcegraph/scip-typescript/main/README.md)) — **no** API de incremental per-file en README.
- Announce 2022: LSIF dificultaba incremental; SCIP **desbloquea** incremental “once implemented” (futuro al momento del post) ([announce](https://about.sourcegraph.com/blog/announcing-scip)).
- CKB docs confirman el estado práctico hoy: indexers SCIP full-project ([CKB Incremental](https://codeknowledge.dev/docs/Incremental-Indexing)).

**Fit:** capa de fidelidad / ingest para backends tipo CKB; **no** es por sí solo el motor MCP vivo.

---

### 4.9 Otros OSS vistos (secundarios)

| Proyecto | Señal | Por qué no shortlist |
|---|---|---|
| **vexp.dev** ([HN #47222316](https://news.ycombinator.com/item?id=47222316)) | Tree-sitter + SQLite + update on save; Rust binary | Show HN apunta a producto hosted/free-tier; no se fetcheó README OSS primario aquí |
| **Code-Graph-RAG** ([HN #47211486](https://news.ycombinator.com/item?id=47211486)) | Tree-sitter → Memgraph → MCP | Requiere Memgraph; no verificado watch/incremental en esta pasada |

---

## 5. Señal de comunidad

| Señal | Dato | Fuente |
|---|---|---|
| Show HN CRG | 12 pts, 2 comments; autor describe SQLite + hooks PostEdit/PostGit + SHA-256 | [HN 47314090](https://news.ycombinator.com/item?id=47314090) |
| Show HN vexp | 4 pts; benchmark −58% cost; grafo on save | [HN 47222316](https://news.ycombinator.com/item?id=47222316) |
| Show HN Code-Graph-RAG | 1 pt; Memgraph + MCP | [HN 47211486](https://news.ycombinator.com/item?id=47211486) |
| Stars (API 2026-09-24) | CRG 31766; DeusData CBM 44813; code-graph-mcp 78; Kythe 2158; isink17 3; codemap 1 | GitHub API (tablas §2) |
| X/Twitter | No se fetcharon posts primarios en esta sesión | — |

**Cuidado:** stars de CRG/DeusData son orders of magnitude por encima de peers similares de 2026; usar solo como “API dice N”, no como proxy de producción-ready.

---

## 6. Criterios para el grill-with-docs (siguiente)

Preguntas que el grill debe forzar con docs + spike medible en ModoOps (Windows + Cursor):

1. **Definición operativa de “fresco”:** ¿p95 < 3 s desde save hasta query MCP usable? ¿poll ≤ 5 s aceptable?
2. **Astro / `.astro`:** ¿nodos/edges reales o solo fell-through a TS grammar (CRG)? ¿code-graph-mcp indexa algo?
3. **Python + TS cruzado:** ¿edges cross-language existen o solo same-lang name match?
4. **Cursor sin hooks de editor:** ¿`crg-daemon` / `watch` / auto-sync sobrevive a sleep/lock de Windows?
5. **Falsedad de calls:** medir precision/recall en un módulo conocido vs `tsc`/pyright (tree-sitter vs SCIP/LSP).
6. **Licencia / supply chain:** MIT vs FSL vs GPL-3; binarios firmados; SmartScreen.
7. **Costo de verdad SCIP:** si se quiere CKB, ¿el wall-clock de `scip-typescript` + `scip-python` en este repo es tolerable en background?
8. **Paridad con lo que GitNexus daba al agente:** impact / callers / detect_changes — mapear tools 1:1 antes de spike.

---

## 7. Fuera de alcance / niebla

- No se midió latency real en el working tree de ModoOps (research only).
- No se auditó source de watchers (`notify`/`fsnotify`) línea a línea; claims de README.
- No se verificó si los star counts están inflados (solo API).
- No se exploró Glean, Sourcegraph Cloud, ni stack propietario.
- Embeddings / RAG vectorial: presentes en varios (CRG optional, code-graph-mcp Candle, codegraph Ollama) pero no son el eje “índice estructural vivo”.
- Snapshot congelado `/grafo` de ModoOps y retiro de GitNexus: contexto de producto, no re-evaluado aquí.
- Windows: varios dicen “cross-platform” o dan paths; **smoke real = grill**, no esta nota.

---

**Siguiente paso:** `/grill-with-docs` sobre la shortlist (code-review-graph · code-graph-mcp · codebase-memory-mcp) para elegir un spike medible en ModoOps.
