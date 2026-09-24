# ModoOps — agentes

## Índice de código (dev tooling)

Spike **local** en rama `prototype/indice-codigo-crg` (code-review-graph): harness CLI PASS (`tools/indice_codigo/test_frescor_crg.py`). Watch/hooks Cursor = ops manual (README). DB gitignored. `/grafo` JSON **congelado**. ADR `docs/adr/0010-indice-codigo-vivo-laya-dual.md`.

## Exploración (estrategia dual)

- Working tree / “qué miro del diff” → **path A**: skill `laya-recortador` (`tools/laya/recortar_client.py`, status+diff → ≤2 paths → Read).
- Tree limpio / “dónde está X” / callers → **path B (soft)**: `recortar_client.py --indice -g "…" -q "…"` (Índice CRG → Laya ≤2). Si CRG/MCP down: CLI `code-review-graph query|search` o `Grep`/`Read`.
- Hard path B (prohibir Grep estructural) = ticket 04 pendiente.
- No confundir con **Agente ModoOps** (`CONTEXT.md`).
