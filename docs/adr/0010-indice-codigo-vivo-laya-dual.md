# Índice de código vivo + Laya (dev tooling)

Tras retirar GitNexus, el desarrollo con agentes Cursor usa un **Índice de código** fresco (Tree-sitter + update/watch/hooks) y **Laya** solo como recortador ≤2 lecturas desde el Índice. El path **A** (git status+diff → Laya) quedó **retirado** de la sesión: el diff local se mira con git a mano. Path **B** (candidatos del índice → Laya) es el canónico. SCIP/CKB fuera del spike de sesión. La página `/grafo` se **re-exporta** file-level desde el Índice (`tools/grafo/export_grafo_crg.py`, #217); comunidades/flujos vacíos (scope A). No es **Agente ModoOps** ni Techo IA.

**Status:** accepted

**Spike (½–1 día, local):** rama `prototype/indice-codigo-crg`. Índice + MCP Cursor + Laya solo-índice. DB local gitignored (`.code-review-graph/`). Frescor: hooks silenciosos (`tools/indice_codigo/hooks/`, pythonw) o `watch`; no hooks `.sh` (mintty en Windows). Pass = index OK + edit reflejado &lt;5s + search/callers útil. Backup: code-graph-mcp. Fuera: Agente/Tenant, CKB/SCIP, CI de paridad, #213. Re-export `/grafo`: #217.

**Post-pass AGENTS:** solo Índice → Laya; hard contra Grep/Glob estructurales ciegos; Grep solo si abort `no_indice_hits` o CRG down. Specs: #216 (solo-índice), #217 (re-export file-level).

**Considered Options:** solo Laya+git; solo grafo; CKB/SCIP “incremental”; code-graph-mcp o codebase-memory-mcp — elegimos grafo/Índice (CRG) + Laya; path git→Laya retirado tras spike dual; `/grafo` re-export scope A (sin inventar comunidades).
