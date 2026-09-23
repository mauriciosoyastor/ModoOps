# PROTOTYPE — Selector enrutador Matt (#203)

Throwaway. Branch: `prototype/selector-matt-203`.

## Question

¿Laya eligiendo **una** skill Matt (daemon caliente) pasa umbrales #201 vs leer todas (A) o top-2 keyword (B)?

## Run

Daemon con `/v1/seleccionar` (mismo `daemon_http.py` que #202). Si el proceso ya corría sin ese endpoint, reiniciarlo.

```powershell
$env:USE_TF='0'; $env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
.\.venv-win\Scripts\python.exe tools\laya\daemon_http.py
# otra terminal:
.\.venv-win\Scripts\python.exe tools\laya\measure_selector.py
```
