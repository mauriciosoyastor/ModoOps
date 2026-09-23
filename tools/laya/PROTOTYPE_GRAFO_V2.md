# PROTOTYPE — Recortador grafo v2 (#202)

Throwaway. Branch: `prototype/recortador-grafo-v2-202`.

## Question

¿Daemon + candidatos prearmados (sin cold-load ni segundo query) alcanza umbrales #201 vs A/B?

## Run

```powershell
# Terminal 1 — cold once (~33s)
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
$env:PYTHONIOENCODING='utf-8'
.\.venv-win\Scripts\python.exe tools\laya\daemon_http.py

# Terminal 2 — measure (daemon already warm)
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
$env:PYTHONIOENCODING='utf-8'
.\.venv-win\Scripts\python.exe tools\laya\measure_grafo_v2.py
```

One-shot client (agent-shaped):

```powershell
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py -q "…" -g "…" --json
```

## Files

| File | Role |
|------|------|
| `daemon_http.py` | Keep-warm HTTP `127.0.0.1:8765` |
| `recortar_client.py` | Query once → POST candidates |
| `measure_grafo_v2.py` | Pack #201 on archetypes.json |
| `measure_grafo_v2_last.json` | Last run evidence |
