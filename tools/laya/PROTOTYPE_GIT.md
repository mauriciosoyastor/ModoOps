# PROTOTYPE — Recortador git (sesión)

Throwaway. Canónico de sesión Cursor: status+diff → Laya → ≤2 Reads.

## Question

¿Status+diff → Laya (`/v1/recortar-git`) → ≤2 Reads pasa umbrales (hits ≥4/5, ahorro ≥40% vs A, wall ≤2s, no peor que B)?

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
| `daemon_http.py` | `POST /v1/recortar-git` |
| `recortar_client.py` | sesión git |
| `harness_recortador_git.py` | A/B/Laya fixtures |
| `harness_recortador.py` | helpers Laya compartidos |
| `archetypes_git.json` | gold_path + candidates |
| `harness_git_last_run.json` | última evidencia |
