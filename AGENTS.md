# ModoOps — agentes

## Índice de código (dev tooling)

Spike **local** en rama `prototype/indice-codigo-crg` (code-review-graph): harness CLI PASS (`tools/indice_codigo/test_frescor_crg.py`). Watch/hooks Cursor = ops manual (README). DB gitignored. `/grafo` JSON **congelado**. ADR `docs/adr/0010-indice-codigo-vivo-laya-dual.md`.

## Exploración (estrategia dual)

- Working tree / “qué miro del diff” → **path A**: skill `laya-recortador` (`tools/laya/recortar_client.py`, status+diff → ≤2 paths → Read).
- Tree limpio / “dónde está X” / callers / búsqueda estructural → **path B (hard)**:
  1. `recortar_client.py --indice -g "…" -q "…"` (Índice CRG → Laya ≤2) **o** CLI/MCP `code-review-graph` (`search` / `query` / callers).
  2. `Read` solo de `expand[]` o de paths que devolvió el Índice.
  3. **Prohibido** abrir `Grep` / `Glob` estructurales a ciegas mientras el Índice responda.
  4. **Fallback** `Grep`/`Glob`/`Read` solo si: abort `no_indice_hits`, `IndiceCollectError` / CRG down, o path A ya eligió expand.
- No confundir con **Agente ModoOps** (`CONTEXT.md`).
