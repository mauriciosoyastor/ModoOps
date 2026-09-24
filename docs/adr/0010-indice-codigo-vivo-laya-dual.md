# Índice de código vivo + Laya en dos paths (dev tooling)

Tras retirar GitNexus, el desarrollo con agentes Cursor usa un **Índice de código** fresco (&lt;~5 s vía Tree-sitter + watcher/hooks) y **Laya** solo como recortador ≤2 lecturas. Path **A**: working tree (status+diff) — ya canónico. Path **B**: candidatos del índice vivo — spike primero con [code-review-graph](https://github.com/tirth8205/code-review-graph). SCIP/CKB quedan fuera del spike de sesión (generación full-project). La página `/grafo` y su JSON siguen **congelados** hasta un ticket explícito de re-export. No es **Agente ModoOps** ni Techo IA.

**Status:** accepted

**Spike (½–1 día, local — sin issue GitHub):** rama `prototype/indice-codigo-crg`. Solo índice + MCP Cursor (Laya path B en slice siguiente). DB local gitignored (p. ej. `.code-review-graph/`). Frescor: `watch` + hooks PostToolUse; si Windows falla, hooks solos. Pass = index OK + edit `.ts`/`.astro` reflejado &lt;5s + MCP callers/impact útil. Backup: code-graph-mcp. Fuera: Agente/Tenant, re-export `/grafo`, CKB/SCIP, CI de paridad, #213.

**Post-pass AGENTS:** path B soft (“preferí B si MCP up”) hasta cablear Laya B; luego hard contra Grep estructural ciego.

**Considered Options:** solo Laya+git; solo grafo; CKB/SCIP “incremental”; code-graph-mcp o codebase-memory-mcp como spike #1 — elegimos dual A+B y spike code-review-graph (Astro+Cursor+watch documentados; research `docs/research/motores-grafo-indice-vivo.md`).
