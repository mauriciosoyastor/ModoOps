# Research — Gatillos Cursor/git para índice GitNexus stale

> **Ticket:** [#208](https://github.com/mauriciosoyastor/ModoOps/issues/208) (mapa [#207](https://github.com/mauriciosoyastor/ModoOps/issues/207)) · **Rama throwaway:** `research/gatillos-gitnexus-stale-208` · **Fecha:** 2026-09-22 · **Autor:** agente research (Cursor)
> **Pregunta:** ¿Qué gatillos concretos existen hoy para detectar índice GitNexus stale en **Cursor** (hooks) y en **git** (post-commit/merge/pre-push), y qué recomienda el upstream GitNexus (notify vs correr `analyze`)? Incluir riesgos (timeout, corrupción Ladybug/Kuzu) y opciones viables en Windows + este repo.
> **Repo:** `C:\Users\mauri\ProyectosOpencode\ModoOps`
> **Alcance:** tooling del agente Cursor + índice local `.gitnexus/` (gitignored). **No** Agente / Techo IA de producto. **No** implementar hooks ni cambiar CI.

---

## 1. Resumen ejecutivo (TL;DR)

**Hoy en ModoOps no hay ningún gatillo automático de stale instalado** (ni `.cursor/hooks.json`, ni hooks git activos, ni settings Claude con PostToolUse GitNexus). La detección real es **reactiva**: MCP/`list_repos`/`context` reportan `staleness`, y `AGENTS.md` / skills piden al agente correr `analyze` a mano.

Upstream GitNexus recomienda **notify-only**: comparar `git rev-parse HEAD` vs `.gitnexus` `lastCommit` y decirle al agente que corra `analyze` — **nunca** spawnear `analyze` dentro del hook (timeout ≈10s vs rebuild que puede ir a **120s**, riesgo de corrupción WAL Ladybug/Kuzu).

| Superficie | ¿Existe gatillo stale hoy? | Qué hay en upstream | Viable en este Windows |
|---|---|---|---|
| **Cursor nativo** `.cursor/hooks.json` | **No** en este repo | Integración Cursor = **solo augment** (`Shell\|Read\|Grep`), **sin** stale post-commit | Sí: hook Node notify-only en `postToolUse` matcher `Shell` |
| **Claude Code → Cursor** (third-party) | **No** cargado aquí (`~/.claude/settings.json` ausente; `.claude/settings.local.json` solo permissions) | Hook Claude **sí** hace stale notify tras `git commit\|merge\|rebase\|cherry-pick\|pull` | Posible si se registra + Third-Party Imports; ojo: espera `tool_name: Bash` |
| **Git** post-commit / post-merge / pre-push | Solo `*.sample` en `.git/hooks`; sin husky/lefthook | Upstream **evita** git hooks a propósito (no imponer workflow) | Sí: warn/notify o `status` ligero; **no** `analyze` en el hook |
| **MCP / skills / AGENTS.md** | **Sí** (reactivo) | `context` stale; skill CLI documenta notify | Ya operativo; índice medido **6 commits behind** HEAD |

---

## 2. Fuentes primarias consultadas

### 2.1 Locales (ModoOps)

| Artefacto | Qué aporta |
|---|---|
| Issue [#208](https://github.com/mauriciosoyastor/ModoOps/issues/208) / mapa [#207](https://github.com/mauriciosoyastor/ModoOps/issues/207) | Preferencia mapa: **notify** + ensure/pre-push opcional; evitar analyze agresivo por file-save |
| `AGENTS.md` (bloque gitnexus) | “Index stale? Run `node .gitnexus/run.cjs analyze …`”; índice `.gitignore`d; reindex con `--embeddings` |
| `.agents/skills/gitnexus-cli/SKILL.md` | Cuando correr `analyze`; **PostToolUse Claude notifica, no corre analyze** (timeout/corrupción) |
| `.agents/skills/gitnexus-{exploring,debugging,guide,impact-analysis,refactoring}/SKILL.md` | Si `context` dice stale → `analyze` en terminal |
| `docs/research/brecha-vector-fts.md` | Windows + Ladybug extensiones; costos reindex (graph ~14s / embeddings ~217s histórico en `AGENTS.md`) |
| Probe 2026-09-22 | Sin `.cursor/hooks.json`; sin `~/.cursor/hooks.json`; `.git/hooks` solo samples; sin husky; MCP ModoOps `staleness.commitsBehind: 6` |

### 2.2 Cursor (docs oficiales)

| Doc | Qué aporta |
|---|---|
| [Hooks](https://cursor.com/docs/hooks) | Eventos `postToolUse` / `afterShellExecution` / `sessionStart`; `timeout` en segundos; `additional_context` en `postToolUse`; matchers `Shell` |
| [Third Party Hooks](https://cursor.com/docs/reference/third-party-hooks) | Carga `.claude/settings.json`; mapeo `PostToolUse`→`postToolUse`, `Bash`→`Shell`; acepta `hookSpecificOutput` |
| Skill local create-hook | Paths proyecto `.cursor/hooks.json` vs user `~/.cursor/hooks.json` |

### 2.3 GitNexus upstream (GitHub)

| Artefacto | Qué aporta |
|---|---|
| [`gitnexus/hooks/claude/gitnexus-hook.cjs`](https://github.com/abhigyanpatwari/GitNexus/blob/117587d5/gitnexus/hooks/claude/gitnexus-hook.cjs) | Stale notify: HEAD vs meta; mutaciones git; **no** analyze |
| [PR #205 Design Note](https://github.com/abhigyanpatwari/GitNexus/pull/205) | Por qué notify-only; timeout Claude 10s; riesgo corrupción |
| [Commit #1070](https://github.com/abhigyanpatwari/GitNexus/commit/441745c12460f58a7c92bcec1aab2df25c08e068) | Docs: hook **notification-only**, no auto-reindex |
| [`gitnexus-cursor-integration/`](https://github.com/abhigyanpatwari/GitNexus/blob/main/gitnexus-cursor-integration/README.md) | Hook Cursor = **augment** solamente; install **manual** |
| [Issue #1437](https://github.com/abhigyanpatwari/GitNexus/issues/1437) | WAL corrupto Ladybug/VECTOR; remedio `clean --force` |

---

## 3. Estado verificado en este repo (probe read-only)

Corrida 2026-09-22 en `C:\Users\mauri\ProyectosOpencode\ModoOps`:

| Check | Resultado |
|---|---|
| Branch / HEAD | `research/gatillos-…` desde `b6e12eb` (antes: `task/serializacion-skipped-206`) |
| `.cursor/hooks.json` | **Ausente** |
| `~/.cursor/hooks.json` | **Ausente** |
| `.claude/settings.json` | **Ausente** |
| `.claude/settings.local.json` | Solo `permissions.allow` MCP check — **sin hooks** |
| `~/.claude/settings.json` | **Ausente** |
| `.git/hooks` | Solo `*.sample` (incl. `pre-push.sample`, `post-commit` no existe como activo) |
| husky / lefthook / `core.hooksPath` en `package.json` | **No** |
| Índice `.gitnexus/meta` / MCP | `lastCommit: f1774c9…`, `indexedAt: 2026-09-22T23:24:53Z`, `embeddings: 2886`, `embeddingDims: 384`, fts/vector available |
| Staleness MCP | `commitsBehind: 6` — hint: “Run analyze tool to update” |
| `git rev-list --count f1774c9..HEAD` | `6` (coincide) |

Conclusión local: **cero automatización de stale**; solo señales MCP + instrucciones en markdown.

---

## 4. Qué recomienda upstream: notify vs `analyze`

### 4.1 Veredicto

**Notify-only.** El hook (o cualquier script síncrono corto) debe:

1. Filtrar mutaciones git exitosas (`commit|merge|rebase|cherry-pick|pull`).
2. Comparar `git rev-parse HEAD` con `lastCommit` en `gitnexus.json` / `meta.json`.
3. Si difieren, emitir contexto al agente con el comando correcto (`analyze` + `--embeddings` si `stats.embeddings > 0`).
4. **No** invocar `gitnexus analyze` dentro del hook.

Citado en skill in-repo (espejo upstream):

> “In Claude Code, a PostToolUse hook detects staleness after `git commit` and `git merge` and notifies the agent to run `analyze` — the hook does not run analyze itself, to avoid blocking the agent for up to 120s and risking KuzuDB corruption on timeout.”  
> — `.agents/skills/gitnexus-cli/SKILL.md`

### 4.2 Por qué (PR #205 Design Note)

| Enfoque | Problema |
|---|---|
| `analyze` síncrono en hook | Bloquea hasta ~120s; timeout del hook Claude documentado **10s** → proceso matado mid-write |
| Proceso matado mid-write | DB inconsistente / WAL corrupto |
| Notify-only | Check &lt;100ms (`rev-parse` + JSON); el agente elige cuándo reindexar |

El body original del PR #205 describía auto-reindex; el **comentario de diseño mergeado** lo corrige a notify-only. El commit [#1070](https://github.com/abhigyanpatwari/GitNexus/commit/441745c12460f58a7c92bcec1aab2df25c08e068) alinea skills/docs con eso.

### 4.3 Por qué no git hooks en el diseño upstream

PR #205: git hooks no van al repo sin `core.hooksPath`/husky; GitNexus es tooling opcional y no debe imponer workflow a todos los contributors. Prefieren PostToolUse del agente (commits iniciados por el agente).

---

## 5. Gatillos Cursor (hooks)

### 5.1 Eventos útiles del contrato Cursor

Fuente: [cursor.com/docs/hooks](https://cursor.com/docs/hooks).

| Evento | Rol para stale | Output útil |
|---|---|---|
| `postToolUse` | Mejor candidato: tras `Shell` con `git commit|…` | `additional_context` inyectado al agente |
| `afterShellExecution` | Matcher sobre el comando shell | Docs listan **input** (`command`, `output`, `duration`); **no** documentan `additional_context` → malo para “avisar al agente” |
| `sessionStart` | Check al abrir sesión | `additional_context` sí documentado |
| `afterFileEdit` / file-save | **Desaconsejado** por mapa #207 (analyze agresivo) | — |

`timeout` del hook: segundos (configurable). Fallos (crash/timeout) en hooks de permiso fallan open por default salvo `failClosed: true`.

### 5.2 Upstream Claude Code (stale notify existe)

Archivo: `gitnexus/hooks/claude/gitnexus-hook.cjs`.

Comportamiento `handlePostToolUse`:

1. Solo si `tool_name === 'Bash'`.
2. Regex: `/\bgit\s+(commit|merge|rebase|cherry-pick|pull)(\s|$)/`.
3. Solo si `tool_output.exit_code === 0` (si viene).
4. `cwd` absoluto; encuentra `.gitnexus/` (incluye worktrees vía `git-common-dir`).
5. `HEAD` vs `readIndexMeta()` (`gitnexus.json` preferido, fallback `meta.json`).
6. Si stale → stdout JSON Claude-shape:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "GitNexus index is stale … Run `…analyze…`"
  }
}
```

Nota Windows en el propio archivo: **“SessionStart hooks are broken on Windows (Claude Code bug)”** — por eso el contexto de sesión va por `CLAUDE.md` / skills, no por SessionStart.

### 5.3 Upstream Cursor integration (stale **no** existe)

`gitnexus-cursor-integration/hooks/gitnexus-hook.cjs` + `hooks.json`:

- Matcher: `Shell|Read|Grep`, `timeout: 10`.
- Solo corre `gitnexus augment` y emite `{ "additional_context": "…" }`.
- **No** compara HEAD/`lastCommit`.
- Install: **manual** por proyecto (`npx gitnexus setup` no copia hooks; sí MCP + skills a `~/.cursor`).
- Requiere Cursor **2.4+**.
- Cross-platform Node (`npx.cmd` en Windows) — sin bash.

### 5.4 Puente third-party Claude → Cursor

[Third Party Hooks](https://cursor.com/docs/reference/third-party-hooks): con “Include Third-Party Plugins, Skills, and Other Configs” (on por default), Cursor carga hooks de `.claude/settings*.json` y mapea eventos/tools.

**Gap concreto:** el hook Claude filtra `tool_name !== 'Bash'`, mientras el contrato Cursor nativo usa `Shell`. Si Cursor entrega `Shell` al script Claude sin remapeo del payload, el stale notify **nunca dispara**. Hay que verificar con `GITNEXUS_DEBUG` o preferir un adapter Cursor-nativo que acepte `Shell`.

### 5.5 Qué hay hoy en ModoOps para Cursor

Nada instalado. Las skills y `AGENTS.md` son el único “gatillo” (instrucción al LLM cuando lee `context` stale).

---

## 6. Gatillos git (post-commit / merge / pre-push)

### 6.1 Estado en este repo

Solo samples en `.git/hooks`. **Ningún** post-commit, post-merge ni pre-push activo. Sin husky.

### 6.2 Posibles diseños (ninguno implementado aquí)

| Hook | Acción alineada con upstream | Acción peligrosa |
|---|---|---|
| `post-commit` / `post-merge` | Escribir stamp / echo a stderr / tocar flag “stale”; opcional script que **solo** compare HEAD vs meta | `gitnexus analyze` síncrono |
| `pre-push` | `node .gitnexus/run.cjs status` o compare commits; **warn** o exit no-cero si behind N commits (ensure) | Bloquear push con analyze en línea |
| `prepare-commit-msg` | Fuera de scope stale | — |

Upstream (PR #205) **elige no** imponer git hooks. El mapa #207 sí contempla “ensure/pre-push opcional” como preferencia de ModoOps — compatible si el ensure es **check ligero**, no rebuild.

### 6.3 Commits fuera del agente

PostToolUse Cursor/Claude **no ve** commits hechos en terminal externa o GUI. Para esos casos hace falta git hook local, check en `sessionStart`, o depender de MCP `staleness` al primer `list_repos`/`context`.

---

## 7. Riesgos (timeout, Ladybug/Kuzu)

| Riesgo | Evidencia | Mitigación |
|---|---|---|
| Timeout del hook mata `analyze` mid-write | PR #205: timeout Claude 10s vs analyze hasta 120s | Notify-only; analyze en terminal/agente con presupuesto largo |
| WAL / DB corrupta | [#1437](https://github.com/abhigyanpatwari/GitNexus/issues/1437): “Corrupted wal file”; a veces exit 0 engañoso (fixed ≥1.6.4 para VECTOR 404) | `gitnexus clean --force` + reanalyze; no auto-analyze en hooks |
| Lock single-writer Ladybug | Hook Claude: si MCP `serve` tiene el DB, augment se saltea / hint MCP | No lanzar segundo `analyze` mientras MCP escribe |
| Embeddings caros en Windows | `AGENTS.md` / brecha-vector: embeddings históricos ~217s; este índice ya tiene `embeddings: 2886` | Preservar `--embeddings` si `stats.embeddings > 0`; no `analyze` sin flag en reindex “ciego” |
| SessionStart roto en Windows (Claude) | Comentario en hook Claude | Usar skills/AGENTS o Cursor `sessionStart` nativo (no Claude SessionStart) |
| Shell scripts en Windows | Polyglot Claude plugins necesitan bash/Git Bash | Preferir hook **Node** (como cursor-integration) |
| Cloud agents | User `~/.cursor/hooks.json` **no** corre en cloud; sí `.cursor/hooks.json` del repo | Versionar hooks de proyecto si se quieren en cloud |

---

## 8. Opciones viables (Windows + ModoOps) — sin implementar

Ordenadas de más alineadas a upstream → más “ensure” estilo mapa #207.

### A. Status quo reforzado (cero código nuevo)

- Agente lee `gitnexus://repo/ModoOps/context` / `list_repos.staleness` y corre `node .gitnexus/run.cjs analyze --embeddings` cuando `commitsBehind > 0`.
- Ya documentado en skills + `AGENTS.md`.
- **Pros:** sin riesgo de corrupción por hooks. **Contras:** reactivo; fácil olvidar.

### B. Cursor `postToolUse` notify-only (recomendado para #210/#212)

- `.cursor/hooks.json` + script Node (fork del check Claude, tool `Shell`, respuesta `{ "additional_context": "…" }`).
- Matcher: `Shell` (y opcionalmente regex en el script sobre `git commit|merge|…`).
- `timeout: 5–10` (solo rev-parse + JSON).
- **Pros:** mismo patrón upstream; Windows-friendly; no toca Ladybug. **Contras:** no cubre commits fuera del agente.

### C. Instalar solo `gitnexus-cursor-integration` (augment)

- Mejora búsquedas con grafo; **no** resuelve stale.
- Mencionar para no confundir “tenemos hooks” con “tenemos freshness”.

### D. Git `pre-push` ensure (opcional, mapa #207)

- Script que falla o advierte si `HEAD != lastCommit` (o `commitsBehind >= N`).
- Mensaje: correr `node .gitnexus/run.cjs analyze --embeddings`.
- **No** llamar analyze desde el hook.
- **Pros:** cubre commits GUI/terminal. **Contras:** hay que documentar install local (core.hooksPath / husky) — upstream lo evita por eso.

### E. `sessionStart` Cursor notify

- Al abrir workspace/sesión, si stale → `additional_context`.
- **Pros:** atrapa drift al empezar. **Contras:** no es el momento “justo después del commit”; no usar SessionStart Claude en Windows.

### F. Explicitamente descartar

- `analyze` en `afterFileEdit` / cada save (mapa #207).
- `analyze` síncrono en cualquier hook con timeout corto.
- Watcher continuo sin debounce + sin cola (fuera de scope #207 “Not yet specified”).

---

## 9. Analogía (para handoff)

El índice GitNexus es como un **mapa en papel** del repo. Cada commit mueve las calles. Upstream no reimprime el mapa en la puerta giratoria del edificio (hook de 10s): **pone un cartel** “el mapa está desactualizado — pedí uno nuevo cuando puedas”. Reimprimir a la fuerza con la puerta a medio cerrar rasga el mapa (WAL).

---

## 10. Implicaciones para tickets siguientes

| Ticket | Qué hereda de #208 |
|---|---|
| [#210](https://github.com/mauriciosoyastor/ModoOps/issues/210) Contrato sano | SLA freshness = “notify en ≤1 acción post-commit agente” + “ensure pre-push opcional”; reindex = humano/agente fuera del hook |
| [#211](https://github.com/mauriciosoyastor/ModoOps/issues/211) Ensure + smoke | Ensure = check HEAD/meta (+ doctor paridad), no analyze embebido |
| [#212](https://github.com/mauriciosoyastor/ModoOps/issues/212) Veredicto automatización | Decault: **B** (Cursor notify) ± **D** (pre-push warn); no auto-analyze |

---

## 11. Afirmaciones clave ↔ cita

| Afirmación | Fuente |
|---|---|
| Hook Claude notifica, no corre `analyze` | `.agents/skills/gitnexus-cli/SKILL.md`; PR #205 Design Note; commit #1070 |
| Mutaciones vigiladas: commit/merge/rebase/cherry-pick/pull | `gitnexus-hook.cjs` Claude `handlePostToolUse` |
| Señal stale = HEAD ≠ `lastCommit` | Mismo archivo + `meta.json`/`gitnexus.json` |
| Cursor integration = augment, no stale | `gitnexus-cursor-integration/README.md` + hook CJS |
| `postToolUse.additional_context` | [Hooks docs](https://cursor.com/docs/hooks) |
| Claude hooks cargables en Cursor | [Third Party Hooks](https://cursor.com/docs/reference/third-party-hooks) |
| Bash→Shell mapping; Claude hook hardcodea `Bash` | Third Party docs + Claude hook source |
| Sin hooks en ModoOps hoy | Probe §3 |
| Índice 6 commits behind | MCP `list_repos` + `git rev-list` |
| Corrupción WAL / clean --force | GitNexus #1437 |
| Preferencia mapa notify + ensure | Issue #207 body |

---

## 12. Fuera de alcance / no verificado

- Comportamiento exacto del remapeo `tool_name` cuando Cursor ejecuta un script Claude (necesita captura `GITNEXUS_DEBUG` en vivo).
- Si `afterShellExecution` acepta outputs no documentados.
- Job CI `grafo` (off en mapa #207).
- `--pdg` (fuera de paridad MVP).
