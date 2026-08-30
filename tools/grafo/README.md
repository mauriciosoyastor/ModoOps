# Herramienta de Grafo — ModoOps (GitNexus)

> Grafo de código de ModoOps. Indexado con GitNexus (1555 nodos, 3163 aristas, 70 comunidades, 123 flujos).
> Ubicación índice: `.gitnexus/lbug` · Repo: `ModoOps` (branch master) · `npx gitnexus status` para verificar.

## Qué es

Un knowledge graph del codebase:
- **Nodos**: `File`, `Function`, `Class`, `Method`, `Property`, `Community`, `Process`
- **Aristas**: `DEFINES`, `CALLS`, `IMPORTS`, `HAS_METHOD`, `HAS_PROPERTY`, `ACCESSES`, `MEMBER_OF`, `STEP_IN_PROCESS`, `CONTAINS`

Consulta vía MCP (`gitnexus_query`, `gitnexus_context`, `gitnexus_impact`, `gitnexus_trace`, `gitnexus_cypher`) o vía CLI local `tools/grafo/grafo.mjs`.

## Uso rápido

```bash
# Verificar índice
npx gitnexus status

# Re-indexar tras cambios grandes
npx gitnexus analyze --index-only --verbose
# con --pdg para capas CFG/CDG/REACHING_DEF (taint + controles)

# CLI helper (wrapper amigable)
node tools/grafo/grafo.mjs query "onboarding smoke boot"
node tools/grafo/grafo.mjs context --name build_pdf --file docs/generar_pdf_ventas_repuestos.py
node tools/grafo/grafo.mjs impact --target post_init_hook --direction upstream
node tools/grafo/grafo.mjs trace --from paint --to renderShell
node tools/grafo/grafo.mjs cypher "MATCH (f:File) RETURN f.filePath LIMIT 5"
node tools/grafo/grafo.mjs communities
node tools/grafo/grafo.mjs processes --limit 5

# Exportar datos para visualización web
node tools/grafo/export-grafo.mjs
# genera web/public/grafo-data.json y web/src/lib/grafo/data.ts
```

## Visualización web

- Ruta: `http://localhost:4321/grafo` (Astro dev)
- Página: `web/src/pages/grafo.astro` (vis-network, import map CDN)
- Datos: `web/public/grafo-data.json` (pre-generado, ~200 nodos file-level + comunidades)
- Filtros: tipo de arista (CALLS/IMPORTS/HAS_METHOD), comunidad, búsqueda, foco en nodo

## Estructura

```
tools/grafo/
  README.md          ← este archivo
  grafo.mjs          ← CLI helper (query/impact/trace/cypher/communities/processes)
  export-grafo.mjs   ← exporta grafo-data.json para la web
web/
  src/pages/grafo.astro   ← página visual
  src/lib/grafo/types.ts  ← tipos TS del grafo
  public/grafo-data.json  ← datos serializados (gitignored si > 500KB)
```

## Workflow agente (Opencode)

1. **Explorar**: `gitnexus_query` → `gitnexus_context` → `gitnexus_trace`
2. **Impacto antes de editar**: `gitnexus_impact` (upstream/downstream) + `gitnexus_detect_changes`
3. **Refactor seguro**: `gitnexus_rename` (preview graph+text)
4. **Debug**: `gitnexus_explain` / `gitnexus_pdg_query` si `--pdg` activo

## Troubleshooting

- `Cannot find module .gitnexus/run.cjs` → `npx gitnexus analyze` (regenera runner)
- `FTS extension unavailable` → normal offline; BM25 deshabilitado, vector search OK si `--embeddings`
- Índice stale tras commit → `npx gitnexus analyze --index-only` y reiniciar MCP
