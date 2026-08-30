<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **ModoOps** (1720 symbols, 3422 relationships, 136 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact analysis before editing.** Use `impact({target: "symbolName", direction: "upstream"})` (MCP) or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .` (CLI fallback); report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/ModoOps/context` | Codebase overview, check index freshness |
| `gitnexus://repo/ModoOps/clusters` | All functional areas |
| `gitnexus://repo/ModoOps/processes` | All execution flows |
| `gitnexus://repo/ModoOps/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## ModoOps — Grafo GitNexus paritario (384d)

> **Spec:** `docs/spec-grafo-gitnexus-modoops.md:1` · **Glosario:** `CONTEXT.md:276` · **Checklist:** `npx gitnexus doctor` → `graph: available, fts: available, vector: available, Semantic mode: vector` + `embeddingDims==384`

- **Dónde vive:** `.gitnexus/` local por dev, `.gitignore`d no versionado (no `.git/info/exclude` solo). Reindex: `npx gitnexus analyze --force --embeddings` (primera vez `GITNEXUS_LBUG_EXTENSION_INSTALL=auto` con red 15s+ por extensión) o `npx gitnexus analyze --embeddings` incremental; luego `load-only` offline. Dueño: dev que toca código.
- **Contrato primario:** MCP directo `npx gitnexus mcp` → `query`/`context`/`impact`/`cypher`/`trace`/`detect_changes` (skill `gitnexus-guide` es solo prompt). Ver `docs/research/consumo-agente-tokens.md`.
- **Árbol determinista (obligatorio, no opcional):**
  ```
  exploratorio / "¿dónde está X?" → query({search_query, goal})
  nombre conocido / "¿quién usa X?" → context({name})
  previo a editar / "¿qué rompo?" → impact({target, direction:"upstream", summaryOnly:true}) primero
  A→B / "¿cómo se conectan?" → trace({from, to})
  estructural / COUNT / EXTENDS / IMPORTS → cypher({statement})
  pre-commit / "¿qué toqué?" → detect_changes({scope:"all"})
  ```
  `grep`/`glob` solo si `context` no resuelve (CSS, strings UI, markdown no-code) o `epistemic: lower-bound` / `receiverTyping`. **Prohibido** `Grep("pos_discount")` ciego cuando el símbolo existe en el grafo — erradica desvío LLM y ahorra 60–90% tokens (3 arquetipos medidos en spec §5).
- **Degradación:** `Grafo → exact-scan (auto, limit 10000, sin HNSW/BM25) → grep`. Con `fts/vector: available` query <50ms híbrida; sin, exact-scan 2.5s degradado pero funcional (task #6 validado: graph 14.4s/26MB, embeddings 217s/38MB +108MB cache → `embeddings:1150`).
- **Probar ahorro:** muestreo 3 arquetipos (exploratoria, símbolo, blast radius) `grep+Read` vs `query→context→impact` contando `tool calls + tokens` opencode; target **≥60% tokens, ≥50% calls** con `doctor` `available`.
