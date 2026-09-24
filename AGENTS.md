# ModoOps — agentes

## Índice de código (dev tooling)

Spike **local** en rama `prototype/indice-codigo-crg` (code-review-graph): harness CLI PASS (`tools/indice_codigo/test_frescor_crg.py`). Frescor: hooks silenciosos (`tools/indice_codigo/hooks/`) o `watch`. DB gitignored. `/grafo` re-export file-level desde Índice (`tools/grafo/export_grafo_crg.py`, #217). ADR `docs/adr/0010-indice-codigo-vivo-laya-dual.md`.

## Exploración (solo grafo / Índice)

- “Dónde está X” / callers / búsqueda estructural → **Laya solo-índice** (path B hard):
  1. `recortar_client.py -g "…" -q "…"` (Índice CRG → Laya ≤2) **o** CLI/MCP `code-review-graph`.
  2. `Read` solo de `expand[]` o de paths que devolvió el Índice.
  3. **Prohibido** `Grep` / `Glob` estructurales a ciegas mientras el Índice responda.
  4. **Fallback** `Grep`/`Glob`/`Read` solo si: abort `no_indice_hits` o CRG down.
- “Qué mirar del diff” → **git status/diff a mano** (fuera de Laya; path A retirado).
- No confundir con **Agente ModoOps** (`CONTEXT.md`).
