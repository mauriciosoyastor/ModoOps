# Spec — Observabilidad portal del chat IA junto a oficina 3D

> Delta sobre `Spec 0011` (chat configurador con oficina viva y envío a WhatsApp). Glosario: `CONTEXT.md` — Prospecto, Agente ModoOps, Herramienta ModoOps, Orquestador, Falla cerrada, Techo IA, Memoria del Agente. Nuevo término: `Observabilidad portal` (distinto de `Auditoría tenant`).

## Problem Statement

El Prospecto conversa con la cajita IA al lado de la oficina 3D y el equipo no puede saber qué laburó: si respondió de memoria estática sin costo, si llamó al modelo local o si cayó al suplente por reglas, cuánto tardó ni si pegó en cuota. Sin eso, un "la IA no responde" es ciego.

## Solution

Cada pregunta libre deja una comanda mínima sin datos personales (quién-hash, qué intento, qué herramienta eligió, ollama/mock/estática, cuánto tardó, pasó o falló) visible en logs del server y con un badgecito chico en el hilo. El Prospecto sigue sin ver interior técnico y sus datos de contacto nunca se guardan en esta capa.

## User Stories

1. Como Prospecto, quiero preguntar en criollo y ver al instante si me responde al momento o si sigue por reglas, para no quedarme esperando.
2. Como Prospecto, quiero que mi nombre y teléfono no se guarden por preguntar a la IA, para preguntar tranquilo.
3. Como Prospecto de teclado, quiero que el badge de estado se anuncie como el resto del hilo, para enterarme igual.
4. Como Consultor, quiero saber cuántas consultas caen en falla cerrada con CTA, para medir si el chat deriva bien a borrador y WhatsApp.
5. Como Consultor, quiero distinguir estática vs modelo vs suplente, para saber si el modelo local está caído sin entrar al server.
6. Como Dueño, quiero ver latencia y uso de cuota por IP hasheada, para decidir cuánto LLM gratis sostengo.
7. Como Dueño, quiero que el portal nunca publique precio de ancla por esta vía, para no violar la política de precios públicos.
8. Como Implementador, quiero un solo punto de log en la ruta pública, para no duplicar observabilidad en cada adapter.
9. Como Implementador, quiero que el texto guardado vaya truncado y sanitizado, para evitar inyección en logs.
10. Como Soporte, quiero ver rate_limited, quota_exceeded y needs_tool contados como el resto, para explicar "probá en una hora o seguí por WhatsApp".

## Implementation Decisions

- **Vocabulario:** se usa `Observabilidad portal` para esto. `Auditoría tenant` queda reservada a corridas con Contexto Tenant en el log de tenant. Prospecto sin Tenant, sin PII persistida.
- **Ruta pública:** mide tiempo alrededor de la llamada al modelo, resuelve intento informativo vs libre, y emite un log JSON de una línea por consulta (incluye errores 400/429/422). El techo mensual cuenta toda consulta, sin ramas exentas.
- **Contrato de log:** timestamp, hash estable de IP, intento, herramienta elegida, origen, latencia en ms, resultado, largo de historial. Mensaje truncado a 200 caracteres, sin respuesta completa, sin nombre ni contacto.
- **Modelo:** mantiene intento local instantáneo para lo informativo, llamada al modelo local con timeout corto y validación contra catálogo, caída a suplente determinístico si falla. El origen se propaga a la respuesta.
- **Decisión portal:** solo la herramienta informativa pasa; stock, cobros u otra van a falla cerrada con CTA a borrador y WhatsApp. Sin cursor Tenant.
- **UI:** la caja IA pinta turno de usuario y de asistente, pinta falla con acciones (WhatsApp y volver a preguntas), y agrega sufijo de origen. Copy en voseo, sin exponer nombres internos de herramientas. Respeta prefers-reduced-motion del panel.
- **Seguridad:** hash de IP con función existente, sin guardar PII; sanitizar truncado (sin saltos ni control); no loguear prompt de sistema, catálogo ni credenciales; no exponer input del modelo al browser; mantener rate-limit por IP y validación de mensaje e historial.

## Testing Decisions

- **Qué hace un buen test aquí:** probar comportamiento externo a través de la ruta pública, sin modelo real ni browser: manda mensaje fake, aserta origen, herramienta visible y códigos. No testea interior del modelo.
- **Seams testeados:** ruta pública (origen estático, 400 ante vacío o historial inválido, 429 tras 20/h, techo mensual contado incluso en rama estática, rama libre devuelve echo con origen válido). Badge UI por inspección manual, no por test de DOM pesado.
- **Prior art:** suite existente de la ruta pública del chat y specs de chat-oficina-whatsapp. Mismo estilo input a respuesta.

## Out of Scope

- Tabla en Control Plane o retención larga (esto es log de server 30 días, no memoria 90 días de tenant).
- Guardar texto completo, respuestas completas o datos de contacto en esta capa.
- Cambiar el juez portal (sigue pasando solo echo), crear Tenant desde portal, o tocar auditoría tenant.
- Métricas de drop-off del guion, e-commerce, CRM, MRP, archivo JSONL con rotación (va después si hace falta).
- Cambios a Infra Multi-DB o Grafo GitNexus.

## Further Notes

- Delta sobre Spec 0011 (chat configurador con oficina viva). El envío a WhatsApp sigue igual: texto legible más JSON borrador-v1 pegado por el Prospecto, gate mínimo de nombre más contacto.
- Retención portal 30 días (no 90 de tenant). Orígenes posibles: estatica, ollama, mock.
