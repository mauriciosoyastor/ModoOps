# Research — Brecha FTS / vector / embeddings en ModoOps (extension-unavailable en Windows)

> **Ticket:** #2 · **Rama throwaway:** `research/brecha-vector-fts` · **Fecha:** 2026-08-30 · **Autor:** agente AFK research
> **Pregunta:** ¿Qué falta para pasar de `graph:available / embeddings:0 / fts|vectorSearch: unavailable (extension-unavailable)` a grafo completo con **FTS + vectorSearch** en Windows, y cómo habilitar **embeddings offline** sin filtrar código a servicios externos?
> **Repo:** `C:\Users\mauri\OneDrive\Desktop\ProyectosOpencode\ModoOps` · **Commit indexado:** `97432d0` · **CLI:** `gitnexus 1.6.10` · **Node:** `v24.12.0 win32/x64` · **LadybugDB:** `0.19.1`

---

## 1. Resumen ejecutivo (TL;DR)

| Capa | Estado hoy | Qué falta |
|------|------------|-----------|
| **Grafo** | `available` (199 files, 1555 nodes, 3163 edges, 70 comunidades, 123 procesos) | nada — ya paritario |
| **FTS (BM25)** | `unavailable` · `provider: ladybugdb-fts` · `skipReason: extension-unavailable` | Instalar extensión `fts` de LadybugDB + dependencias runtime (VC++ Redist + OpenSSL 3 en Windows). Una instalación con red y reindex repara FTS sin re-pasar todo el grafo (`--repair-fts`). |
| **Vector / embeddings** | `unavailable` · `provider: ladybugdb-vector` · `embeddings: 0` · `exactScanLimit: 10000` | Lo mismo para `vector` + generar embeddings locales. El **provider es local offline por defecto** (`Snowflake/snowflake-arctic-embed-xs`, 384 dims, ~22 M params, ~90 MB). No hace falta API externa. Modo HTTP (Ollama/OpenAI-compatible) es opt-in. |
| **Búsqueda hoy** | Degradada pero funcional: `gitnexus query` cae a **exact-scan** (cosine exacto sobre hasta 10k chunks; lento pero correcto) y FTS no aporta ranking BM25. | Habilitar ambas extensiones vuelve el ranking a híbrido BM25+vector indexado (HNSW) y elimina el límite exact-scan. |

**Costo/privacidad/latencia:** local es **gratis, offline, sin filtrar código**, latencia de re-index < 2 min para 199 files en CPU (estimado). HTTP es alternativa si se quiere GPU/modelo grande pero implica red y custodia de código.

**Pasos concretos (offline):** instalar una vez el **VC++ Redist 2015-2022 x64** + asegurar **OpenSSL 3 DLLs** en PATH (o correr desde Git Bash), luego un único comando con red: `GITNEXUS_LBUG_EXTENSION_INSTALL=auto npx gitnexus analyze --force --embeddings` (cubre vector+fts; para FTS solo: `npx gitnexus analyze --repair-fts` con la misma env). Tras eso el índice vuelve a ser offline-first (`load-only` por defecto) y no necesita red en `query`/`serve`.

---

## 2. Estado verificado — fuentes primarias

### 2.1 `.gitnexus/gitnexus.json:50-72` y `meta.json` (idénticos)

```json
"stats": { "files": 199, "nodes": 1555, "edges": 3163, "communities": 70, "processes": 123, "embeddings": 0 },
"capabilities": {
  "graph": { "provider": "ladybugdb", "status": "available" },
  "fts": { "provider": "ladybugdb-fts", "status": "unavailable", "skipReason": "extension-unavailable" },
  "vectorSearch": { "provider": "ladybugdb-vector", "status": "unavailable", "exactScanLimit": 10000 }
},
"embeddingDims": 384,
"cjkSegmentation": "none",
"schemaFingerprint": "6827b7d6b062"
```

- `embeddingDims 384` ya es el default del modelo local (ver §3); no hay mismatch.
- Tamaño en disco `.gitnexus/` hoy: **~25 MB** (`lbug` 20.5 MB + caches). Medido vía `Get-ChildItem .gitnexus -Recurse`.

### 2.2 `npx gitnexus doctor` (misma máquina, `win32/x64`)

```
Graph store:      available
Full-text search: unavailable
  Binder exception: Extension: fts is an official extension and has not been installed. You can install it by: install fts.
  The FTS extension is not installed. Re-run with network access and GITNEXUS_LBUG_EXTENSION_INSTALL=auto (or `gitnexus analyze --repair-fts`) to download it.
VECTOR index:     unavailable
  Binder exception: Extension: vector is an official extension and has not been installed. You can install it by: install vector.
  The VECTOR extension is not installed. Re-run with network access and GITNEXUS_LBUG_EXTENSION_INSTALL=auto to download it.
Semantic mode:    exact-scan
Ext install:      load-only (offline; load only, no network install)
Exact scan limit: 10000 chunks
Embeddings
  Backend:    local
  Device:     auto
  Threads:    4
  Batch:      16 nodes / Sub-batch: 8 chunks
  Support:    ✓ local embeddings supported
  CUDA:       n/a (no system CUDA detected)
```

El mensaje `load-only (offline)` es el **default global** desde PR #1161: los paths de *lectura* (`serve`/`query`) nunca tocan red. El path de *escritura* (`analyze`) usa `auto` por defecto (ver §4).

### 2.3 `npx gitnexus analyze --help` (extracto relevante)

- `--embeddings [limit]` — habilita generación de embeddings; sin flag preserva los ya presentes. Límite de seguridad 50k nodos (0 = sin límite).
- `--repair-fts` — reconstruye índices FTS sin re-analizar todo el grafo.
- `--drop-embeddings` — descarta embeddings en rebuild.
- `--embedding-base-url / --embedding-model / --embedding-auth-token / --embedding-dims` — modo HTTP OpenAI-compatible (ej. Ollama `http://…/v1`). Overrides `GITNEXUS_EMBEDDING_URL` etc.
- `--embedding-threads / --embedding-batch-size / --embedding-sub-batch-size / --embedding-device` — tuning local ONNX.

Fuentes: `gitnexus@1.6.10 dist/cli/index.js` (yargs definitions) y `dist/core/embeddings/config.js:resolveEmbeddingConfig`.

---

## 3. Provider real de embeddings — local vs API

### 3.1 Default: **local offline**, sin API

- **Modelo:** `Snowflake/snowflake-arctic-embed-xs` — 22 M params, **384 dims**, ~90 MB descarga — definido en `dist/core/embeddings/types.js:DEFAULT_EMBEDDING_CONFIG` (`modelId`, `dimensions: 384`, `maxSnippetLength: 500`, `chunkSize: 1200`, `overlap: 120`).
- **Runtime:** `@huggingface/transformers` (^4.1.0) → `onnxruntime-node` (^1.24.0) como `optionalDependencies` en `gitnexus/package.json`. `npx gitnexus embeddings install` repara instalaciones donde npm podó el stack optional (proxy HTTP, #2370). Soporte verificado por `doctor`: `✓ local embeddings supported`.
- **Device:** `auto` → `cuda` si detecta CUDA efectivo, si no `cpu` (`dist/core/embeddings/embedder.js:getLocalEmbeddingRuntimeBlocker`, `isEffectiveCudaAvailable`). `wasm`/`dml` también válidos pero `wasm` no rescata `darwin/x64` porque el fallo es al importar el binding nativo (#1515).
- **Cache:** `HF_HOME` → `env.cacheDir` (default `~/.cache/huggingface`), `HF_ENDPOINT` → `env.remoteHost` (bridge en `dist/core/embeddings/hf-env.js:applyHfEnvOverrides`). Sin `HF_HOME`, transformers caería a `node_modules/.cache` (no escribible en instalación global). En esta máquina **no existe** aún `~/.cache/huggingface` → confirma `embeddings:0`, nunca se descargó el modelo.
- **Chunking:** `chunkSize 1200` / `overlap 120` chars, `EMBEDDING_TEXT_VERSION v4` para invalidar vectores stale (`dist/core/embeddings/embedding-pipeline.js:contentHashForNode`). Nodos larguísimos se trocean AST-aware (`types.js:CHUNKABLE_LABELS` vs `SHORT_LABELS`).

**Privacidad:** 100% local, sin filtrar código a red externa. El único fetch es la descarga inicial del modelo desde HuggingFace (una vez). Tras eso, reindex y queries son offline.

### 3.2 Alternativa HTTP (opt-in)

- Activa cuando `GITNEXUS_EMBEDDING_URL` o `--embedding-base-url` apunta a un endpoint OpenAI-compatible `/v1` (Ollama `http://10.219.32.29:11434/v1`, vLLM, etc.) — `dist/core/embeddings/embedder.js:isHttpMode()`, `http-client.js`.
- Requiere `--embedding-model` (ej. `qwen3-embedding:8b`) y `--embedding-dims` debe coincidir con `embeddingDims` del índice (384 por defecto, pero Qwen3-8B es 4096 → rompería compatibilidad si no se reindexa con ese dims).
- **Cuándo usarlo:** GPU disponible, modelo más potente, o `darwin/x64` donde local está bloqueado. No es necesario en este Windows.

### 3.3 Opciones offline (sin red nunca / red una vez)

| Escenario | Config | Efecto |
|-----------|--------|--------|
| **Offline puro, sin instalar nada** | `GITNEXUS_LBUG_EXTENSION_INSTALL=never` o `load-only` (default lectura) | FTS/vector siguen `unavailable`; `query` usa exact-scan (limit 10k). Embeddings locales fallan al descargar modelo → no se generan. Útil solo para lectura degradada. |
| **Offline tras una instalación con red** (recomendado para ModoOps) | Una vez con red: `GITNEXUS_LBUG_EXTENSION_INSTALL=auto npx gitnexus analyze --force --embeddings` | Descarga extensiones LadybugDB (`fts`, `vector`) + modelo HF (~90 MB) y los deja en disco. Siguientes runs son `load-only` sin red. |
| **HTTP offline dentro de LAN** | `GITNEXUS_EMBEDDING_URL=http://ollama-local:11434/v1` con Ollama en la misma red/VPS | No toca Internet, pero el código viaja al servicio interno. Vectores se indexan igual. |
| **Espejo HF / proxy** | `HF_ENDPOINT=https://hf-mirror.com/` + `HF_HOME=/path/cache` | Redirige descarga del modelo sin tocar `huggingface.co` (GFW/proxy corporativo). |

---

## 4. Por qué `extension-unavailable` en Windows

### 4.1 Mecanismo de carga

- LadybugDB carga extensiones como DLLs dinámicas vía `LOAD EXTENSION <name>` (`dist/core/lbug/extension-loader.js:ExtensionManager.ensure`).
- **Política por defecto:**
  - *Read paths* (`serve`/`query`/`doctor`) → `load-only` (nunca hace `INSTALL`, no toca red) — `resolvePolicyFromEnv()` default.
  - *Write path* (`analyze`, incluyendo FTS fase 85–90% y VECTOR en `embedding-pipeline.js:resolveEmbeddingInstallPolicy`) → `auto` (intenta `LOAD`; si falla, hace **un** `INSTALL` acotado en proceso hijo vía `scripts/install-duckdb-extension.mjs` con `installDuckDbExtensionOutOfProcess`, timeout 15 s, luego reintenta `LOAD`). Respeta `GITNEXUS_LBUG_EXTENSION_INSTALL=load-only|never|auto` si está seteado.
- En esta máquina `doctor` muestra `Ext install: load-only` → el `analyze` previo corrió sin `GITNEXUS_LBUG_EXTENSION_INSTALL=auto` explícito pero el default `auto` del write path debería haber intentado INSTALL. Que siga `extension-unavailable` indica que el INSTALL no tuvo red, o falló por dependencias runtime (ver 4.2), o la máquina estaba en modo offline.

### 4.2 Clasificador de fallos (`dist/core/lbug/extension-load-error.js:classifyExtensionLoadError`)

| Clase | Señal | Remedio |
|-------|-------|---------|
| **missing_file** | `has not been installed` | `GITNEXUS_LBUG_EXTENSION_INSTALL=auto` + re-run con red; `INSTALL` descarga ~2 MB. |
| **corrupt_file** | `invalid elf` / `file too short` / `not a valid` (Win error 193) / `bad magic` / `wrong architecture` / `mach-o` / `truncat` | `FORCE INSTALL` re-descarga. |
| **missing_dependency** (el caso Windows) | Win error 126: `找不到指定的模块` / `specified module could not be found` (y resto POSIX: `cannot open shared object`) | **Reinstalar la extensión NO ayuda.** Falta runtime: **VC++ Redist 2015-2022 x64** (`vc_redist.x64.exe` @ `https://aka.ms/vs/17/release/vc_redist.x64.exe`) y/o **OpenSSL 3** (`libcrypto-3-x64.dll` / `libssl-3-x64.dll`). El propio mensaje lo dice: `The FTS/VECTOR extension is present but a required runtime library is missing (Windows error 126).` |
| **hedged** | `Failed to load library: {path} which is needed by extension: {name}` con tail localizado no enumerado (francés/alemán/japonés) | Mensaje genérico con ambas ramas; diagnóstico vía `doctor`. |

**Caso concreto ModoOps (Windows):** el `doctor` hoy dice `The FTS extension is not installed` (clase `missing_file`), no `missing_dependency`. Eso sugiere que el archivo ni llegó a descargarse (falta de red o política `load-only` en ese run). Pero **una vez instalado**, el error 126 por falta de VC++ Redist es el siguiente escalón más común en Windows — el propio `extension-load-error.js` documenta: en Windows el `.dll` instala bien pero `LoadLibrary` falla con 126 porque la extensión importa dinámicamente OpenSSL 3 / MSVC 14 DLLs que no vienen con Windows. GitNexus mitiga: `Git for Windows` trae esas DLLs en `C:\Program Files\Git\mingw64\bin` — correr el mismo comando desde **Git Bash** o añadir ese dir al `PATH` ya resuelve el 126 sin instalar nada más (hint en `VC_REDIST_INSTALL_HINT` + `GIT_BASH_OPENSSL_HINT`).

### 4.3 Dónde vive la extensión en disco (Windows)

- DuckDB/LadybugDB resuelve el dir de extensiones a `~/.kuzu/extension/<version>/` (o variante Ladybug). En esta máquina no se encontró `~/.kuzu` ni `~/.lbug` → confirma que nunca se instaló.
- El `INSTALL` del proceso hijo abre una LadybugDB scratch en `os.tmpdir()/gitnexus-ext-install-*` (`scripts/install-duckdb-extension.mjs:defaultConnect`), ejecuta `INSTALL fts` / `INSTALL vector` (o `FORCE INSTALL` si el LOAD previo indicó corrupción), y cierra. La extensión queda persistida en el dir global, no en `.gitnexus/`.

---

## 5. Tamaño y tiempo estimados para 199 files / 1555 nodes

### 5.1 Tamaño

- **Grafo actual:** `.gitnexus/lbug` 20.5 MB + total `.gitnexus/` 25 MB (medido). Estimación Ladybug: ~4 KB por elemento (node+rel) → 1555+3163 ≈ 4.7k elementos × 4 KB ≈ 18 MB, consistente.
- **Vectores:** 384 dims × 4 bytes (float32) ≈ 1.5 KB por chunk. Nodos embeddables = subset de 1555 (solo `EMBEDDABLE_LABELS`: Function/Method/Class/Interface/Struct/Enum… + short labels). Estimación: ~300–600 chunks (1 chunk/nodo corto, 2–4 chunks/nodo largo con `chunkSize 1200`). → **0.5–1 MB** de vectores raw + overhead HNSW → **~2–5 MB** extra en `lbug`. Total índice tras embeddings: **~27–30 MB** (vs 25 MB hoy). Irrelevante.
- **Modelo en caché (fuera de `.gitnexus/`):** `snowflake-arctic-embed-xs` ~90 MB en `~/.cache/huggingface` (o `HF_HOME`). No va al repo ni al artefacto `.gitnexus/`.
- **Extensiones LadybugDB:** cada una ~2–5 MB en `~/.kuzu/extension`. Despreciable.

### 5.2 Tiempo de reindex

- Referencia: el `analyze` previo de 199 files sin embeddings tomó ~segundos (log no capturado, pero `doctor`/pipeline WIP típico < 30 s para este tamaño).
- **Con embeddings local CPU:** pipeline batch `16 nodes` / `subBatch 8 chunks`, `threads 4` (doctor). Para ~500 chunks, son ~63 sub-batches ONNX. En CPU moderna ~0.5–1 s por sub-batch → **~30–60 s extra** + 10–15 s de descarga inicial del modelo (una vez). **Total reindex estimado: 45–90 s** con `--embeddings`. Sin descarga, < 60 s.
- **Con `--repair-fts` solo:** < 10 s (re-tokeniza filas existentes, no re-parsea).
- **Memoria:** buffer pool default `min(2 GiB, 80% RAM)` — sobrado para este repo (pool adaptativo `~elements × 4 KB` ≈ 18 MB). No hay riesgo OOM.

---

## 6. Pasos concretos — de 0 embeddings a índice vectorial funcional en `C:\Users\mauri\OneDrive\Desktop\ProyectosOpencode\ModoOps\.gitnexus`

### 6.1 Prerrequisitos Windows (una vez)

```powershell
# 1) VC++ Redist 2015-2022 x64 (si no está)
winget install Microsoft.VCRedist.2015+.x64  # o descargar https://aka.ms/vs/17/release/vc_redist.x64.exe y ejecutar

# 2) Verificar OpenSSL 3: si falla con 126 tras instalar extensión, o bien:
#    a) instalar OpenSSL 3 x64 (https://slproweb.com/products/Win32OpenSSL.html), o
#    b) correr gitnexus desde Git Bash (ya trae libcrypto-3-x64.dll en C:\Program Files\Git\mingw64\bin), o
#    c) añadir C:\Program Files\Git\mingw64\bin al PATH en PowerShell:
$env:PATH = "C:\Program Files\Git\mingw64\bin;$env:PATH"
```

Verificación prerrequisitos: `npx gitnexus doctor` debe pasar de `Extension: fts is not installed` a `missing_dependency` (si falta runtime) o `available` (si todo ok). El error con `126` vs `not installed` distingue la rama.

### 6.2 Instalar stack local (si `doctor` reporta stack faltante)

Normalmente no hace falta (doctor hoy dice `✓ local embeddings supported`). Solo si se ve `Local semantic embeddings are unavailable` / `Cannot find module ...onnxruntime_binding.node`:

```powershell
npx gitnexus embeddings install
# con CUDA opcional: npx gitnexus embeddings install --cuda
```

### 6.3 Habilitar FTS + vector + embeddings (con red, una vez)

```powershell
# Desde PowerShell con red habilitada:
$env:GITNEXUS_LBUG_EXTENSION_INSTALL="auto"
npx gitnexus analyze --force --embeddings 2>&1 | Tee-Object analyze-embeddings.log

# Alternativa si solo se quiere reparar FTS sin re-embeddear:
# $env:GITNEXUS_LBUG_EXTENSION_INSTALL="auto"
# npx gitnexus analyze --repair-fts
```

- `--force` fuerza reindex completo (necesario para crear `EMBEDDING_TABLE_NAME` y el HNSW index la primera vez).
- Sin `--force` y sin `--embeddings`, un `analyze` posterior **preserva** embeddings ya presentes (`--drop-embeddings` para borrarlos).
- `--embeddings 0` desactiva el cap de 50k nodos (innecesario aquí).

**Offline espejo HF (si `huggingface.co` bloqueado):**

```powershell
$env:HF_ENDPOINT="https://hf-mirror.com/"
$env:HF_HOME="C:\Users\mauri\.cache\huggingface"
$env:GITNEXUS_LBUG_EXTENSION_INSTALL="auto"
npx gitnexus analyze --force --embeddings
```

### 6.4 Verificar paridad

```powershell
npx gitnexus doctor
# Esperado:
#   Full-text search: available
#   VECTOR index:     available
#   Semantic mode:    vector

Get-Content .gitnexus\gitnexus.json | Select-String -Pattern "capabilities|embeddings|vectorSearch|fts" -Context 0,4
# Esperado: capabilities.fts.status == "available", capabilities.vectorSearch.status == "available", stats.embeddings > 0

npx gitnexus query "launcher hub POS" --help  # smoke test: debe usar BM25+vector, no solo exact-scan
```

### 6.5 Vuelta a offline

Tras el run exitoso, no hace falta setear nada: `doctor` reporta `Ext install: load-only` por defecto y las extensiones/modelo ya están en disco. Comando diario con repo cambiado:

```powershell
npx gitnexus analyze --force --embeddings   # o sin --force para incremental; preserva embeddings
# sin necesidad de GITNEXUS_LBUG_EXTENSION_INSTALL=auto (ya está cacheado, LOAD basta)
```

Para bloquear red explícitamente en CI/offline: `$env:GITNEXUS_LBUG_EXTENSION_INSTALL="load-only"` o `never`.

### 6.6 Modo HTTP (alternativa, no recomendada aquí salvo GPU)

```powershell
$env:GITNEXUS_EMBEDDING_URL="http://10.219.32.29:11434/v1"
$env:GITNEXUS_EMBEDDING_MODEL="qwen3-embedding:8b"
$env:GITNEXUS_EMBEDDING_DIMS="384"  # o 4096 si se reindexa con ese modelo — embeddingDims en gitnexus.json debe coincidir
npx gitnexus analyze --force --embeddings --embedding-dims 384
```

Nota: cambiar dims requiere reindex (`embeddingDims` en `gitnexus.json` queda fijado al crear el índice).

---

## 7. Riesgos y decisiones abiertas

- **Windows error 126 tras INSTALL:** si `doctor` pasa a `present but a required runtime library is missing`, aplicar §6.1 (VC++ Redist + OpenSSL). No reinstalar la extensión.
- **Path no-ASCII:** si el repo viviera en `C:\Users\…\ProyectosOpencode\ModoOps` con tildes, LadybugDB en Windows usa `CreateFileA` (ANSI) — GitNexus mitiga vía junctions/short-paths (`lbug-config.js:toNativeSafePath`), pero mover a path ASCII es fallback.
- **Exact-scan limit 10k:** hoy `vectorSearch.exactScanLimit: 10000` — con 1555 nodes no se alcanza, pero sin vector index la búsqueda semántica es O(n) exacta; habilitar vector la hace HNSW indexada.
- **PDG:** fuera de alcance de este ticket (ver ticket #1 `Not yet specified`). `--pdg` agrega nodos `BasicBlock` + edges `CFG/CDG/REACHING_DEF` — costo extra no estimado aquí; decidir en ticket #4.
- **Freshness/SLA:** este research no define ciclo de reindex (ticket #5). Con `--embeddings`, cada `analyze` sin `--drop-embeddings` preserva vectores y recalcula hash (`EMBEDDING_TEXT_VERSION v4` + `contentHashForNode`) para reemplazar stale — incremental es barato.

---

## 8. Resumen provider / costo / privacidad / latencia (para desbloquear definición de paridad)

| Dimensión | Local (recomendado) | HTTP (Ollama/OpenAI-compat) |
|-----------|---------------------|------------------------------|
| **Modelo** | `Snowflake/snowflake-arctic-embed-xs` (384 dims, 22M) — `types.js:DEFAULT_EMBEDDING_CONFIG` | Cualquiera vía `GITNEXUS_EMBEDDING_URL` (ej. `qwen3-embedding:8b` 4096 dims) |
| **Costo** | Gratis, sin API key | Gratis si self-hosted (Ollama), pago si proveedor externo |
| **Privacidad** | Código nunca sale de la máquina; solo descarga inicial de ~90 MB desde HF (cacheable/mirror) | Código se envía al endpoint HTTP (LAN o Internet) — filtrado si externo |
| **Latencia reindex (199 files)** | ~45–90 s (una vez +90 MB), siguientes < 60 s | Similar o menor si endpoint GPU; red añade RTT |
| **Latencia query** | HNSW local < 50 ms; exact-scan < 200 ms para este repo | Igual (query embed local o remoto según modo) |
| **Tamaño índice** | +2–5 MB en `.gitnexus/lbug` | Idem |
| **Offline** | Sí tras primer run con red | Solo si endpoint es local (LAN) |
| **Windows** | Soportado (`doctor: ✓ local embeddings supported`) | También soportado |
| **Bloqueo** | Solo `darwin/x64` está bloqueado (`runtime-support.js`) — no aplica | Nunca bloqueado |

**Recomendación para ticket #4 (paridad):** fijar `embeddingDims: 384` (default local) + `vectorSearch: available` + `fts: available` como **paridad mínima** del grafo base ModoOps. No cambiar dims a 4096 sin justificación (rompe compatibilidad, modelo 10× más grande). Dejar `--pdg` como decisión aparte.

---

## 9. Referencias primarias (claim → source)

- `gitnexus.json:50-72` + `meta.json` → estado `graph:available`, `fts/vector unavailable`, `embeddings:0`, `embeddingDims:384`.
- `npx gitnexus doctor` → mensajes `extension-unavailable`, `load-only`, `exact-scan`, `Backend: local`.
- `npx gitnexus analyze --help` → flags `--embeddings`, `--repair-fts`, `--embedding-*`, dims.
- `dist/core/embeddings/types.js:DEFAULT_EMBEDDING_CONFIG` → `modelId: Snowflake/snowflake-arctic-embed-xs`, `dimensions:384`.
- `dist/core/embeddings/embedder.js` + `runtime-support.js:getLocalEmbeddingRuntimeBlocker` → bloqueo solo `darwin/x64`.
- `dist/core/embeddings/hf-env.js:applyHfEnvOverrides` → `HF_HOME`/`HF_ENDPOINT` bridge.
- `dist/core/lbug/extension-loader.js:resolveAnalyzeInstallPolicy` + `ExtensionManager.ensure` → `load-only` global vs `auto` en analyze, `INSTALL` en hijo.
- `scripts/install-duckdb-extension.mjs:chooseInstallVerb` + `dist/core/lbug/extension-load-error.js:classifyExtensionLoadError` + `missing_dependency` signatures → Windows 126 VC++/OpenSSL.
- `dist/core/lbug/lbug-config.js:LBUG_MAX_DB_SIZE`, `DEFAULT_BUFFER_POOL_CAP`, `toNativeSafePath` → sizing y path no-ASCII.
- `gitnexus/package.json` → `optionalDependencies: @huggingface/transformers ^4.1.0, onnxruntime-node ^1.24.0`, `version 1.6.10`.
- `dist/core/embeddings/embedding-pipeline.js:EMBEDDING_TEXT_VERSION v4`, `resolveEmbeddingInstallPolicy` → vector install policy.

---

*Fin — dejar validación humana antes de ejecutar reindex en producción. Próximo: tickets #3→#4→#5 para cerrar spec de paridad y contrato de consumo.*
