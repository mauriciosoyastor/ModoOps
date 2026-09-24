# ModoOps — agentes

## Índice de código (dev tooling)

Spike **local** en rama `prototype/indice-codigo-crg` (code-review-graph): harness CLI PASS (`tools/indice_codigo/test_frescor_crg.py`). Watch/hooks Cursor = ops manual (README). DB gitignored. `/grafo` JSON **congelado**. ADR `docs/adr/0010-indice-codigo-vivo-laya-dual.md`.

## Exploración (estrategia dual)

- Working tree / “qué miro del diff” → **path A**: skill `laya-recortador` (`tools/laya/recortar_client.py`, status+diff → ≤2 paths → Read).
- Tree limpio / “dónde está X” / callers → **path B (soft)**: preferí Índice de código vía MCP `code-review-graph` / CLI `code-review-graph query|impact|search` si está up; si no, `Grep` / `Glob` / `Read`.
- Laya sobre candidatos del Índice = ticket pendiente (`.scratch/indice-codigo-vivo/issues/03-…`). Hard path B después.
- No confundir con **Agente ModoOps** (`CONTEXT.md`).
