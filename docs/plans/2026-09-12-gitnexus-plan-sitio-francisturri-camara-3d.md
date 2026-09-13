# GitNexus Engineering Plan

> Task: S1 pagina publica FrancisTurriFotografia con hero camara 3D (rotar/zoom/presets)
> Evidence verified at commit 460b0ad25b6083d4a20e75181b9925bcff6a2da5; GitNexus index 19 commits behind, refresh skipped (freshness:accept, source-weighted).
> Evidence provenance schema 2; global dirty digest 8f333edaac3b79f2667732fbb5ac679edfb3dad83e8b745a2ebd54461dc1b9dc; cited-path manifest 12 sorted entries; exact generated plan path excluded.

## Objective (§1)

Pagina publica Astro del fotografo (`/francisturri`) con hero de camara 3D interactiva: rotar + zoom por mouse y teclado, presets frontal/lateral/lente con estado en URL, estatica con `prefers-reduced-motion`. Base de S2/S3.

## Current Behaviour (§2–3) — ≤10 lines, architecture folded in

No existe pagina de fotografo [verified]. Patron a clonar: `oficina.astro` monta `mountOficinaScene(canvas, onPick, etiquetas?)` por `import()` dinamico en script inline; `output:'server'` con paginas publicas por defecto (ruta nueva no cae en prefijos protegidos de `middleware.ts`) [verified]. `BaseLayout` ya incluye `FloatingWhatsApp` global (numero ModoOps) y SEO/OG [verified].

## Findings (§4–5) — only load-bearing, each tagged + tool-named

- `query` (oficina 3D scene): `mountOficinaScene` en `web/src/scripts/oficina-scene.ts:34`, contrato `OficinaHandle` (cleanup llamable + `resaltar`/`marcar`) — nueva escena espeja ese contrato [graph+verified].
- `context` (`mountOficinaScene`): `epistemic:exact`, sin callers en grafo (montaje por `import()` dinamico no indexado: `oficina.astro:1084`, `oficina-chat.astro:803`) — impacto nulo en codigo existente [graph+verified].
- `grep` three: `OrbitControls` + IBL `RoomEnvironment` (0KB red) + guard `matchMedia(reduced-motion)` en escena y paginas; CSS global `global.css:48` [verified].
- `business.ts:8`: `contact.whatsapp` es numero ModoOps — S1 hereda flotante global; numero del fotografo va en S3 (override/env) [verified].
- Tests: vitest sin script npm (solo dep en `web/package.json`); patron `home.test.ts` (handler + backend stub). Para escena: extraer logica pura testeable (vista↔URL) [verified].

## Proposed Changes (§6)

- Nuevo `web/src/scripts/camara-scene.ts`: `mountCamaraScene(canvas)` con primitivas Three (cuerpo+lente+diales), `OrbitControls` con damping, IBL `RoomEnvironment`, presets `frontal|lateral|lente` via `setVista(id)`; retorna cleanup. Respeta `web/AGENTS.md`.
- Nuevo `web/src/lib/foto-vista.ts`: `parseVista(search): VistaId` / `serializeVista(id)` — logica pura, sin DOM.
- Nueva `web/src/pages/francisturri.astro`: `BaseLayout` + hero (canvas + controles preset como `<button>` con estado en URL) + slot de secciones S2/S3. Publica sin tocar `middleware.ts`.
- Nuevo `web/src/lib/foto-vista.test.ts`: round-trip parse/serialize + default ante URL invalida.

## Implementation Sequence (§7) — risks inline as step notes

1. `foto-vista.ts` + test (riesgo: ninguno; corre con `npx vitest run` desde `web/`).
2. `camara-scene.ts` clonando contrato/IBL/luces de `oficina-scene.ts:34-70` (riesgo: peso — sin GLB, solo primitivas; reusar intensidad env 0.5).
3. `francisturri.astro` con `import()` dinamico + guard reduced-motion (patron `oficina.astro:371,1084`) (riesgo: SSR — escena solo en cliente).
4. Verificar `npm --prefix web run build` + pagina responde sin sesion (publica).

## Test Strategy (§8)

- `foto-vista.test.ts`: `?vista=lateral`→lateral; `?vista=x`→frontal; serialize round-trip.
- Manual: teclado rota/hace zoom; presets actualizan URL; `prefers-reduced-motion` congela; sin sesion no redirige a `/login`.
- Comandos: `npx vitest run src/lib/foto-vista.test.ts` (en `web/`), `npm --prefix web run build`.

## Implementation Context (§11)

```yaml
implementation_context:
  task_summary: 'S1 #182: pagina publica /francisturri con hero camara 3D (rotar/zoom/presets, estado en URL, reduced-motion estatico)'
  acceptance_criteria:
    - 'Camara responde rotar+zoom por mouse y teclado; presets cambian vista y URL'
    - 'Reduced-motion: escena estatica; sin sesion: pagina publica (no redirect login)'
    - 'Build web en verde'
  evidence_provenance:
    schema_version: 2
    head_commit: '460b0ad25b6083d4a20e75181b9925bcff6a2da5'
    generated_plan_path: 'docs/plans/2026-09-12-gitnexus-plan-sitio-francisturri-camara-3d.md'
    global_dirty_digest:
      algorithm: 'sha256'
      canonicalization: 'gitnexus-evidence-provenance-v2 NUL-framed UTF-8 records'
      value: '8f333edaac3b79f2667732fbb5ac679edfb3dad83e8b745a2ebd54461dc1b9dc'
    cited_path_manifest:
      - path: 'package.json'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'clean'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:f499ca849e9b1153130f396c1e169380b638e8b8a63472dbef1f9b28033f7e71'
        index_digest: 'sha256:f499ca849e9b1153130f396c1e169380b638e8b8a63472dbef1f9b28033f7e71'
        worktree_digest: 'sha256:f499ca849e9b1153130f396c1e169380b638e8b8a63472dbef1f9b28033f7e71'
        untracked_digest: 'absent'
      - path: 'web/AGENTS.md'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'clean'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:ad4caae9210667fcfc571d3408c9506977479f720fe015b8c4decadef9ef9cd5'
        index_digest: 'sha256:ad4caae9210667fcfc571d3408c9506977479f720fe015b8c4decadef9ef9cd5'
        worktree_digest: 'sha256:4bd2e94b2a0107e75fb772ea5300976c401c99557d348c124ed6d44aa423d639'
        untracked_digest: 'absent'
      - path: 'web/astro.config.mjs'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'clean'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:2b489dab2e790b52a0d6a1d07bf3d5aa790454f306690b9d0369fe8c5e3ad1e1'
        index_digest: 'sha256:2b489dab2e790b52a0d6a1d07bf3d5aa790454f306690b9d0369fe8c5e3ad1e1'
        worktree_digest: 'sha256:2b489dab2e790b52a0d6a1d07bf3d5aa790454f306690b9d0369fe8c5e3ad1e1'
        untracked_digest: 'absent'
      - path: 'web/package.json'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'clean'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:6508ec0260269d3c0d67eed42ae7afb1cd8797c5abfea6ff92deaa3b0ede679c'
        index_digest: 'sha256:6508ec0260269d3c0d67eed42ae7afb1cd8797c5abfea6ff92deaa3b0ede679c'
        worktree_digest: 'sha256:1dbe652e1f9baf633cd2918179fd68148e97f0753147520724958c6ea12c2754'
        untracked_digest: 'absent'
      - path: 'web/src/components/ui/FloatingWhatsApp.astro'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'clean'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:7791a2dd40e307ed7c61568c24dbb335e53ba7b8c8e5857317e1ef9b52da0f8f'
        index_digest: 'sha256:7791a2dd40e307ed7c61568c24dbb335e53ba7b8c8e5857317e1ef9b52da0f8f'
        worktree_digest: 'sha256:7791a2dd40e307ed7c61568c24dbb335e53ba7b8c8e5857317e1ef9b52da0f8f'
        untracked_digest: 'absent'
      - path: 'web/src/data/business.ts'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'clean'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:d97e718319258f6764d361348b79f32cd3d443d261863c96ab30c6149ca02e3c'
        index_digest: 'sha256:d97e718319258f6764d361348b79f32cd3d443d261863c96ab30c6149ca02e3c'
        worktree_digest: 'sha256:f8aacebc4976cb74b536e8b271274ff0c4803551fcfa4128eb8d67374b5fa642'
        untracked_digest: 'absent'
      - path: 'web/src/layouts/BaseLayout.astro'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'clean'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:9249fa4040f6dc72cf017971d0cedb6ed098529bfd3ea4401b2672bcc1094985'
        index_digest: 'sha256:9249fa4040f6dc72cf017971d0cedb6ed098529bfd3ea4401b2672bcc1094985'
        worktree_digest: 'sha256:6028d5e1a493990a9953f98c80a02420bc2395cd56cfd91e59e4ece359a4e095'
        untracked_digest: 'absent'
      - path: 'web/src/middleware.ts'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'clean'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:c5a74248ee604369e789156c44678f5677edeff2c0b2edc41b2b8593a33b4993'
        index_digest: 'sha256:c5a74248ee604369e789156c44678f5677edeff2c0b2edc41b2b8593a33b4993'
        worktree_digest: 'sha256:896e6bdc47a2b06791215feb5d6696dceb0996b6c94c50aa45e3a9a836aee3c2'
        untracked_digest: 'absent'
      - path: 'web/src/pages/api/tenant/[slug]/home.test.ts'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'clean'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:031e669e9f154aa42f5e683c7aa527ebcf50a47da132d3214197ba0a0036794b'
        index_digest: 'sha256:031e669e9f154aa42f5e683c7aa527ebcf50a47da132d3214197ba0a0036794b'
        worktree_digest: 'sha256:893c2fa40c7a136e2e02e6d5469ee97143cfe2308c7d6691c034153024e66959'
        untracked_digest: 'absent'
      - path: 'web/src/pages/oficina-chat.astro'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'clean'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:b5b4c279fcf90762f967d61fb0b076f4ed807db0c1e5ebb488d4f8057a022789'
        index_digest: 'sha256:b5b4c279fcf90762f967d61fb0b076f4ed807db0c1e5ebb488d4f8057a022789'
        worktree_digest: 'sha256:75edadc5ca4796aebda6eefb8d1d5be5c7f2e0ab41fc6b8e1f8b202fbf6fea5b'
        untracked_digest: 'absent'
      - path: 'web/src/pages/oficina.astro'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'unstaged'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:520db02a14e362824e83015e5cf5a7df1ded522e83dc1bde2001dbf5f8b7a62d'
        index_digest: 'sha256:520db02a14e362824e83015e5cf5a7df1ded522e83dc1bde2001dbf5f8b7a62d'
        worktree_digest: 'sha256:f77c7eccdb2803c033beb82225ea20fd79e2eda3ad70650542b3be4912098d6c'
        untracked_digest: 'absent'
      - path: 'web/src/scripts/oficina-scene.ts'
        object_kind: {head: 'regular', index: 'regular', worktree: 'regular', untracked: 'absent'}
        state: 'clean'
        rename_from: null
        rename_to: null
        head_digest: 'sha256:ef67e2bad3ccaaa1c642d06e68926182fc9419eee901b597f7a5e9859b804f60'
        index_digest: 'sha256:ef67e2bad3ccaaa1c642d06e68926182fc9419eee901b597f7a5e9859b804f60'
        worktree_digest: 'sha256:1782f6ebe49eeb2aae1f009ce2b403d300cd4fc27b5ddaeec49180303f017250'
        untracked_digest: 'absent'
  files_to_modify:
    - {file: 'web/src/lib/foto-vista.ts', symbols: ['parseVista', 'serializeVista'], intended_change: 'Nuevo modulo puro VistaId frontal|lateral|lente <-> querystring'}
    - {file: 'web/src/lib/foto-vista.test.ts', symbols: [], intended_change: 'Nuevo test round-trip + default invalido'}
    - {file: 'web/src/scripts/camara-scene.ts', symbols: ['mountCamaraScene', 'setVista'], intended_change: 'Nueva escena camara con primitivas + OrbitControls + presets'}
    - {file: 'web/src/pages/francisturri.astro', symbols: [], intended_change: 'Nueva pagina publica hero canvas + botones preset con estado URL'}
  tests:
    - {file: 'web/src/lib/foto-vista.test.ts', scenarios: ['?vista=lateral -> lateral', '?vista=x -> frontal (default)', 'serialize(parse(x)) round-trip']}
  verification_commands: ['npx vitest run src/lib/foto-vista.test.ts (en web/)', 'npm --prefix web run build']
  assumptions: ['Indice 19 commits detras: blast-radius nulo verificado en fuente (import dinamico)', 'Diferencias worktree vs blob son CRLF Windows, no ediciones (git status limpio salvo oficina.astro)']
  open_questions: ['Ruta final /francisturri vs tenant/[slug]/sitio (default: /francisturri; S4 vincula)', 'Fotos reales galeria llegan en S2 (v1: placeholders)']
  avoid: ['Do not repeat full repository discovery', 'Do not replace established patterns without evidence', 'No tocar middleware.ts (ruta ya publica)', 'No instalar GLB/SDK WebGI (primitivas Three)', 'No cambiar contact.whatsapp global (numero fotografo va en S3)']
```

## Assumptions and Open Questions (§12)

- [assumed] Worktree-vs-blob delta = CRLF Windows (status limpio salvo `oficina.astro` modificado) — re-verificar en work.
- [assumed] Sin script `test` en `web/package.json`: correr vitest con `npx` desde `web/`.
- Ruta `/francisturri` vs `tenant/[slug]/sitio`; fotos galeria en S2; diferidos S2/S3/S4.

## Definition of Done (§13)

- [ ] `foto-vista.test.ts` verde + `npm --prefix web run build` verde.
- [ ] Hero navegable por teclado, presets en URL, estatico con reduced-motion, publico sin login.
- [ ] Sin cambios en `middleware.ts`, `business.ts` ni escenas existentes.
