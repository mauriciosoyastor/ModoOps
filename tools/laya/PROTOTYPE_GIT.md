# PROTOTYPE — Recortador git (sesión)

Throwaway. Canónico de sesión Cursor tras ADR `docs/adr/0010-laya-recortador-git-not-grafo.md`.

## Question

¿Status+diff → Laya (`/v1/recortar-git`) → ≤2 Reads pasa umbrales (hits ≥4/5, ahorro ≥40% vs A, wall ≤2s, no peor que B) sin GitNexus?

## Run

```powershell
# Daemon (si cold o sin /v1/recortar-git: cerrar consola vieja y ensure)
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
$env:PYTHONIOENCODING='utf-8'
.\.venv-win\Scripts\python.exe tools\laya\ensure_daemon.py

# Harness fixtures
.\.venv-win\Scripts\python.exe tools\laya\harness_recortador_git.py

# Cliente sesión
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py -g "…" --json

# Unit seam
.\.venv-win\Scripts\python.exe -m unittest tools.laya.tests.test_recortar_git -v
```

## Files

| File | Role |
|------|------|
| `recortar_git.py` | filter/top-20, serialize, pick, collect status+diff |
| `daemon_http.py` | `POST /v1/recortar-git` (+ `/v1/recortar` legacy) |
| `recortar_client.py` | sesión git; `--grafo` soft-deprecated |
| `harness_recortador_git.py` | A/B/Laya fixtures |
| `archetypes_git.json` | gold_path + candidates |
| `harness_git_last_run.json` | última evidencia |

## Soft-deprecate

`/v1/recortar` + harness grafo: offline/histórico. Sesión: sin `--grafo`.
