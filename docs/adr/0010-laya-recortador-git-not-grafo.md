# Recortador canónico = status+diff → Laya → Read (no grafo)

Cuando el índice GitNexus está stale, Laya sobre procesos del grafo elige mal aunque el modelo esté bien. Decidimos que el recortador de **sesión** del agente Cursor tome candidatos del working tree (status+diff), elija ≤2 paths vía `POST /v1/recortar-git`, y el agente solo haga Read — soft-deprecando grafo→Laya en sesión (el harness grafo offline puede quedar).

**Status:** accepted

**Considered:** keep+gate stale; segunda app Laya dejando grafo canónico; intent de producto/Orquestador. Elegimos reemplazar el path de sesión porque el dolor medido era precisión vs índice mentiroso.

**Consequences:** GitNexus sigue para `impact`/callers; no vive en `CONTEXT.md` (no es Agente/Techo IA); tree limpio aborta sin fallback grafo; fallo de `git` no se reporta como árbol limpio.
