# Research — Daemon / keep-warm Laya en Windows (#200)

> **Ticket wayfinder:** #200 (mapa #198) · **Fecha:** 2026-09-22 · **Autor:** agente research · **Repo:** `C:\Users\mauri\ProyectosOpencode\ModoOps`  
> **Rama:** `research/daemon-laya-keepwarm-200`  
> **Pregunta:** ¿Qué opciones concretas hay para un **daemon / proceso keep-warm** de Laya en Windows (HTTP, stdio, proceso vivo, etc.) que evite el cold-load ~31s del one-shot `tools/laya/recortar.py`, con contrato de entrada/salida usable por el agente Cursor?  
> **Alcance:** research only — no implementar el daemon. Tooling del agente Cursor; **no** Agente ModoOps / Techo IA / Orquestador de producto ([#198](https://github.com/mauriciosoyastor/ModoOps/issues/198)).

## 1. Veredicto (TL;DR)

El SDK `laya==0.3.6` **no** expone HTTP, stdio ni daemon: solo `Agent` / `Router` in-process con `preload` / `attach` / `unload`. El keep-warm oficial es **mantener el proceso Python vivo con el checkpoint ya cargado** ([HF README](https://huggingface.co/convaiinnovations/laya/raw/main/README.md) §Production Preload; [GitHub README](https://raw.githubusercontent.com/NandhaKishorM/laya/main/README.md); `router.py` docstring).

En esta máquina (pesos locales `.models/laya-multilingual`, CPU, `USE_TF=0`):

| Fase | Tiempo medido 2026-09-22 |
|---|---:|
| `import laya` | **2.46 s** |
| `laya.load(local)` | **32.59 s** |
| `predict` (1ª, post-load) | **0.22 s** |
| **Cold total** | **~35.3 s** |
| `predict` warm (misma Agent) | **0.21 s** |

Eso valida el ~31s del mapa #198: casi todo es **build del checkpoint**, no la decisión. Warm ≈ **0.2 s** CPU.

**Recomendación para el prototipo del mapa #198 / ticket #202:**  
**daemon HTTP localhost (loopback) + cliente thin CLI** que reutilice el JSON de `recortar.py --json`. Complejidad baja, encaja con Shell del agente Cursor, mide wall-clock warm separado del cold, y alinea con el consejo upstream “for a server or a demo, preload” sin inventar un protocolo raro. MCP stdio queda como upgrade opcional si la carrera pide integración nativa Cursor.

---

## 2. Fuentes primarias

| # | Fuente | Qué aporta |
|---|---|---|
| 1 | [HF `convaiinnovations/laya` README](https://huggingface.co/convaiinnovations/laya/raw/main/README.md) | `Router(preload=True)`; cold “seconds”; reload 7.4s CPU / 10.3s T4 al flip de idioma con `max_loaded=1`; warm 32.8 ms GPU / 193–464 ms CPU; sin API HTTP en el SDK |
| 2 | [GitHub `NandhaKishorM/laya` README](https://raw.githubusercontent.com/NandhaKishorM/laya/main/README.md) | Misma API preload; repo solo módulos `agent/router/…` — sin servidor |
| 3 | [HF Space `laya-demo` `app.py`](https://huggingface.co/spaces/convaiinnovations/laya-demo/raw/main/app.py) | Patrón keep-warm real: Gradio long-lived; `D.get_agent()` + `warmup` al boot; `Router.attach` para no duplicar pesos |
| 4 | PyPI / `.venv-win` `laya==0.3.6` | Exports: `load`, `Agent`, `Router`, `predict_shortlist` — **cero** `server`/`http`/`stdio`/`daemon` en `site-packages/laya/*.py` |
| 5 | `.venv-win/.../laya/router.py` | `preload`, `attach`, `unload`, `max_loaded`, `threading.RLock`; docstring “For a server or a demo, preload” |
| 6 | `tools/laya/recortar.py` + skill `laya-recortador` | Contrato one-shot actual: Shell → JSON `expand[]` |
| 7 | `docs/research/laya-checkpoint-esar-194.md` | Forzar multilingual; precargar una vez; no medir decisión en cold |
| 8 | Issue [#198](https://github.com/mauriciosoyastor/ModoOps/issues/198) / [#200](https://github.com/mauriciosoyastor/ModoOps/issues/200) | Destino mapa; cold-load ~31s; #202 bloqueado por daemon |

Probe local (read-only), misma sesión:

```text
local_path_exists True weights True
import_laya_s=2.455
load_local_s=32.589
predict_s=0.218
total_cold_s=35.262
predict_warm_s=0.208
```

---

## 3. Qué ya existe en ModoOps (sin daemon)

```
Cursor agent / skill
  → Shell: recortar_client.py → daemon keep-warm
       → status+diff + hybrid + predict
       → stdout JSON
```

Contrato de salida usable hoy (`recortar_client.py` + skill):

| Campo | Uso agente |
|---|---|
| `expand[].symbol` + `file` | `context({name, file_path, repo:"ModoOps"})` |
| `expand[].process_id` | referencia |
| `expand[].context_cmd` | hint CLI |
| `laya_choice`, `hybrid_reason`, `n_candidates` | diagnóstico |
| `skipped: true` | no inventar símbolo |

Entrada actual: `--goal` (+ `--query` opcional); candidatos vienen de status+diff (#202).

Harness (`harness_recortador.py`) ya hace `load_laya()` **una vez** por corrida batch; eso no ayuda a la sesión Cursor donde cada Shell es un proceso nuevo.

---

## 4. Opciones concretas (Windows + agente Cursor)

Analogía: Laya es un horno que tarda ~33 s en calentar. Hoy cada pedido del agente enciende el horno, cuece en 0.2 s y lo apaga. El daemon deja el horno prendido.

### Opción A — Status quo: one-shot CLI (baseline)

| | |
|---|---|
| **Mecánica** | Cada Shell = nuevo Python = `laya.load` |
| **I/O agente** | Ya documentado en skill |
| **Cold** | ~35 s total (medido) |
| **Warm** | N/A (nunca reusa) |
| **Costo** | $0; RAM solo durante la corrida |
| **Complejidad** | 0 |
| **Pros** | Cero ops |
| **Contras** | Inútil para medir wall-clock “sesión real” del mapa #198 |

### Opción B — HTTP localhost keep-warm + CLI thin (recomendada)

| | |
|---|---|
| **Mecánica** | Proceso vivo: `load` al start → `http.server` / stdlib o FastAPI en `127.0.0.1:<port>`. Cliente: `recortar-client.py` o `curl` que POSTea JSON |
| **I/O** | POST `/recortar` body `{query,goal}` **o** (para #202) `{candidates,state,goal}` → misma forma que `--json` |
| **Cold** | 1× al levantar daemon (~33–35 s) |
| **Warm** | RTT + predict ≈ **0.2–0.5 s** CPU (orden de magnitud del probe) |
| **Costo** | RAM residente del multilingual (~647 MB pesos docs HF; proceso Python + torch extra) |
| **Complejidad** | Baja–media (stdlib HTTP + reuso de `harness_recortador`) |
| **Pros** | Shell-friendly; health `GET /health`; fácil medir; Windows natural; loopback = sin red pública |
| **Contras** | Hay que arrancar/parar el daemon; puerto ocupado; no es MCP nativo |
| **Alineación upstream** | HF/GitHub: “For a server or a demo, preload”; Space Gradio = proceso largo con load al boot |

Esqueleto de contrato (propuesto, no implementado):

```http
POST /v1/recortar HTTP/1.1
Host: 127.0.0.1:8765
Content-Type: application/json

{"query":"…","goal":"…"}
```

o sin query duplicado (#202):

```json
{"goal":"…","state":"…","candidates":[{"id":"proc_…","summary":"…"}]}
```

Respuesta = objeto actual de `recortar()` (`expand`, `laya_choice`, …).

Arranque tipico Windows (idea):

```powershell
$env:USE_TF='0'; $env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
Start-Process -NoNewWindow .\.venv-win\Scripts\python.exe tools\laya\daemon_http.py
# agente: python tools\laya\recortar_client.py -q "…" -g "…" --json
```

### Opción C — stdio / NDJSON en proceso largo

| | |
|---|---|
| **Mecánica** | Proceso lee líneas JSON por stdin, escribe respuestas por stdout; modelo cargado una vez |
| **I/O** | Mismo JSON que A/B |
| **Cold / warm** | Igual que B una vez vivo |
| **Complejidad** | Media |
| **Pros** | Sin puerto; patrón tipo LSP |
| **Contras** | El Shell de Cursor es **request/response por comando**, no mantiene pipes entre turns del agente. Requiere wrapper externo o MCP. Poco usable “tal cual” desde la skill actual |

**No recomendada** como primer prototipo del mapa salvo que se envuelva en MCP (opción E).

### Opción D — Named pipe / socket Unix-style en Windows

| | |
|---|---|
| **Mecánica** | `\\.\pipe\laya-recortar` o TCP loopback raw |
| **Complejidad** | Media–alta en Windows (ACL, clientes) |
| **Pros** | Local-only |
| **Contras** | Peor DX que HTTP para el agente; sin ganancia clara vs B |

### Opción E — MCP server stdio

| | |
|---|---|
| **Mecánica** | Servidor MCP long-lived; tool `laya_recortar`; Cursor mantiene el proceso |
| **I/O** | Tool args → mismo JSON de expand |
| **Cold** | 1× al conectar MCP (~33 s en el handshake / ready) |
| **Warm** | Latencia tool ≈ predict |
| **Complejidad** | Alta (schema MCP, lifecycle Cursor, debug) |
| **Pros** | Contrato nativo del agente; no Shell; alinea con grafo MCP |
| **Contras** | Overkill para decidir seguir/archivar Laya (#204); cold al (re)conectar MCP sigue doliendo si el host reinicia el server |

Buen **segundo** paso si #202/#204 confirman que Laya se queda.

### Opción F — Solo API SDK `Router(preload=…)` / `Agent` reusado **sin** daemon externo

| | |
|---|---|
| **Mecánica** | Lo que ya hace el harness en una corrida; o un REPL humano |
| **Útil para** | Benchmarks batch (#199 harness), no para N llamadas Shell del agente |
| **Nota** | Con ES-AR forzado (#194) alcanza `laya.load(local)` una vez; no hace falta `Router` multi-checkpoint ni `preload=True` de los tres |

### Opción G — Windows Service / Task Scheduler always-on

| | |
|---|---|
| **Mecánica** | B o E empaquetado como servicio |
| **Complejidad** | Alta ops |
| **Para mapa #198** | Fuera de scope — el mapa pide prototipo medible de sesión, no producción |

### Opción H — HF Space / Gradio remoto

| | |
|---|---|
| **Evidencia** | Space oficial carga pesos al boot y sirve UI |
| **Para ModoOps** | Latencia red + fuera del loop local; **descartada** para el recortador del agente |

---

## 5. Comparativa costo / complejidad / fit Cursor

| Opción | Evita ~33s/call | Fit Shell Cursor | Complejidad | RAM keep-warm | Fit prototipo #198 |
|---|---|---|---|---|---|
| A one-shot | no | excelente | nula | no | baseline only |
| **B HTTP + thin CLI** | **sí** | **excelente** | **baja** | sí (~0.6GB+ pesos) | **mejor** |
| C stdio crudo | sí* | pobre | media | sí | no |
| D named pipe | sí | pobre | media-alta | sí | no |
| E MCP | sí | nativo | alta | sí | fase 2 |
| F in-process only | solo batch | nulo (agente) | nula | no | harness |
| G Win service | sí | ok | alta | sí | overkill |
| H remoto | sí (remoto) | medio | media | remoto | no |

\*si alguien mantiene el pipe abierto fuera del agente.

---

## 6. Contrato I/O recomendado (agente-usable)

Mantener **paridad** con `recortar.py --json` para no reescribir la skill:

**Request (warm path):**

```json
{
  "query": "mockLLM MockLLM callLLM",
  "goal": "Dónde el agente usa mockLLM en vez del LLM real"
}
```

**Request (#202, sin query duplicado):**

```json
{
  "goal": "…",
  "state": "<serialize_state compact lines>",
  "candidates": [{"id":"proc_…","summary":"…","priority":0.1}]
}
```

**Response:**

```json
{
  "query": "…",
  "goal": "…",
  "n_candidates": 5,
  "laya_choice": "proc_…",
  "hybrid_reason": "single|prio_tie:…|prob_tie:…",
  "expand": [
    {"process_id":"…","symbol":"…","file":"…","context_cmd":"…","skipped":false}
  ],
  "next": "Abrí solo estos context…"
}
```

Extras útiles en daemon (no en one-shot hoy):

- `GET /health` → `{ok, model_loaded, uptime_s, device}`
- header o campo `latency_ms` (solo predict) vs `cold_load_s` al boot (para #199 wall-clock)

Env invariantes (ya en skill/#194): `USE_TF=0`, `LAYA_MODEL_PATH=.models/laya-multilingual`, `PYTHONIOENCODING=utf-8`.

---

## 7. Recomendación para el prototipo del mapa #198

1. **Implementar (en ticket #202, no aquí):** Opción **B** — daemon HTTP loopback + thin client CLI que la skill llame igual que hoy (`--json`).
2. **Al boot del daemon:** `os.environ["USE_TF"]="0"` → `load_laya()` (path local) → listo; loggear `load_s`.
3. **Medir en #199:** (a) cold del daemon una vez; (b) wall por recorte warm; (c) tokens agente vs baselines A/B del mapa — **separados**, como pide #198.
4. **No** gastar en MCP (#E) ni Windows Service hasta el veredicto #204.
5. **No** usar `Router(preload=True)` de los tres checkpoints: el recortador ES-AR solo necesita multilingual (#194).
6. Si el daemon no está arriba: skill ya tiene fallback ≤2 `context` sin Laya — mantenerlo.

### Incorrecto / correcto

| Incorrecto | Correcto |
|---|---|
| Medir “ahorro de Laya” incluyendo 33 s de `load` en cada Shell | Levantar daemon → medir solo `predict` + query/hybrid |
| Esperar un flag oficial `laya serve` | No existe en 0.3.6; wrap propio |
| stdio sin host MCP para el agente Cursor | HTTP + CLI o MCP completo |
| Precargar english+multilingual+typed | Solo multilingual local |

---

## 8. Riesgos / límites

- **RAM:** proceso keep-warm ocupa memoria todo el rato; en laptops justas puede paginar y degradar warm.
- **Working tree:** el daemon no ve commits nuevos hasta el próximo `collect` del cliente (status+diff).
- **Seguridad:** bind **solo** `127.0.0.1`; no exponer LAN.
- **Reinicio Cursor / crash Python:** vuelve el cold — documentar “daemon up?” en la skill.
- **Epistemic:** tiempos de esta nota son **una** corrida CPU Windows con pesos locales; GPU/HF download cambiarían números (HF cita 193–464 ms CPU warm post-preload).

---

## 9. Fuentes (lista corta)

1. https://huggingface.co/convaiinnovations/laya/raw/main/README.md — preload, latencias, “server or demo”  
2. https://raw.githubusercontent.com/NandhaKishorM/laya/main/README.md — API idéntica  
3. https://huggingface.co/spaces/convaiinnovations/laya-demo/raw/main/app.py — keep-warm al boot  
4. https://pypi.org/project/laya/ — 0.3.6  
5. `.venv-win/Lib/site-packages/laya/{__init__,router,agent}.py` — sin servidor; `Router.preload`/`attach`  
6. `tools/laya/recortar.py`, `.agents/skills/laya-recortador/SKILL.md` — contrato agente  
7. `docs/research/laya-checkpoint-esar-194.md` — multilingual + preload harness  
8. https://github.com/mauriciosoyastor/ModoOps/issues/198 · #200 — mapa y pregunta  
9. Probe local 2026-09-22: `load_local_s=32.589`, `predict_warm_s=0.208`
