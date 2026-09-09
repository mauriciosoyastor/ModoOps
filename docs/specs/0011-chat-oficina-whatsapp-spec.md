# Spec — Chat configurador con oficina viva y envío a WhatsApp

> Delta sobre `Spec 0010` (oficina Three.js → borrador). Mapa wayfinder cerrado con T1–T5, seams confirmados por el dueño. Publicación pendiente: issue GitHub + label `ready-for-agent` cuando haya `gh auth login` (tracker sin auth en esta sesión, mismo precedente que 0010).

## Problem Statement

El **Prospecto** que llega a ModoOps no puede contar lo que necesita sin una llamada: la oficina virtual se recorre clickeando a ciegas, el **Catálogo ModoOps** completo (taller, Excel, B2B, IA) no se ofrece en lenguaje comerciante, y al terminar no hay un camino de un toque hacia el consultor — el borrador queda en el browser y el primer contacto se pierde. Resultado: menos borradores llegan, los que llegan no cubren todo lo ofrecible, y el consultor arranca el **Descubrimiento pago** de cero igual que antes.

## Solution

Un **chat configurador** al lado de la oficina: el Prospecto responde ~10 preguntas en voseo (su negocio, lo que necesita hoy, para dónde quiere crecer) y con cada "sí" la **oficina 3D se construye en vivo en el panel de al lado**; tocar un mueble devuelve a su pregunta. Al terminar, un botón valida lo mínimo y abre **WhatsApp comercial** con el texto más el borrador JSON v1, y el portal confirma "Recibí tu borrador". El consultor importa al **Configurador interno** y cita al Descubrimiento. Nada crea el Tenant, nada muestra precios de ancla o add-ons, el borrador sigue no vinculante.

## User Stories

1. Como Prospecto, quiero que me pregunten en criollo qué necesito, para no leer tablas de módulos.
2. Como Prospecto retail/taller/pyme, quiero ejemplos de mi palo en cada pregunta, para entender qué me preguntan sin traducir.
3. Como Prospecto, quiero contar mi negocio una sola vez (nombre, contacto, rubro, conteos), para no repetirlo en el Descubrimiento.
4. Como Prospecto, quiero responder sí/no y saltear lo que no aplica, para terminar en 2–3 minutos.
5. Como Prospecto, quiero ver cómo mi oficina se arma a medida que respondo, para sentir que avanzo.
6. Como Prospecto, quiero tocar un mueble y volver a su pregunta, para corregir sin buscar en el chat.
7. Como Prospecto, quiero tildar comprobantes que creo usar más mi contador, para adelantar lo fiscal sin que me prometan el cierre.
8. Como Prospecto, quiero tildar para dónde crecer (taller, Excel, B2B, IA), para planear sin comprometerme hoy.
9. Como Prospecto, quiero que me digan qué va siempre incluido sin pedirlo, para no dudar si me falta algo.
10. Como Prospecto, quiero ver mi borrador vivo mientras respondo, para saber qué lleva el consultor.
11. Como Prospecto, quiero que solo me exijan nombre y un contacto, para no abandonar por un formulario largo.
12. Como Prospecto, quiero un botón que abra WhatsApp con todo armado, para no copiar ni reescribir nada.
13. Como Prospecto, quiero una confirmación inmediata al enviar ("Recibí tu borrador"), para saber que llegó.
14. Como Prospecto sin WebGL o con móvil viejo, quiero el mismo chat con sectores tocables, para completar mi borrador sin 3D.
15. Como Prospecto con `prefers-reduced-motion`, quiero la escena quieta, para no sufrir animaciones.
16. Como Prospecto de teclado, quiero operar chat y sectores sin mouse, para usar el portal igual que todos.
17. Como Prospecto, quiero compartir o refrescar sin perder dónde iba, para retomar mi borrador.
18. Como Consultor, quiero leer texto legible más JSON en el mismo chat, para importar sin re-tipiar.
19. Como Consultor, quiero archivar cada borrador como negocio-fecha, para retomarlo sin confusiones.
20. Como Consultor, quiero que el portal nunca prometa precio ni cierre, para que mi Propuesta sea la única palabra válida.
21. Como Consultor, quiero que las horas del borrador digan "orientativas", para fijar el techo yo en el Descubrimiento.
22. Como Consultor, quiero una primera respuesta en 24h que invite al Descubrimiento, para no dejar el lead frío.
23. Como Consultor, quiero que el fiscal llegue como borrador con contador, para cerrarlo con el Asesor fiscal antes del go-live.
24. Como Consultor, quiero que el ejemplo del chat entre al Configurador con el gate fiscal esperado, para validar el pipeline sin sorpresas.
25. Como Dueño de pricing, quiero cero montos de ancla o add-ons en portal y mensaje, para no violar la política de precios públicos.
26. Como Lector de marca blanca, quiero que el portal hable solo de Módulos ModoOps, para que Odoo viva solo en anexo técnico.
27. Como Implementador, quiero el guion como datos junto al mapping, para agregar preguntas sin tocar la escena.
28. Como Implementador, quiero la dirección chat→3D en un handle aditivo, para no romper la página real del portal.

## Implementation Decisions

- **Tres seams, uno nuevo-extendido:** el mapping objeto↔módulo se extiende con el guion (pregunta → key de catálogo → objeto 3D) y el gate del botón; el `generar` del Configurador se reusa sin cambios; la escena expone resaltar direccional de forma aditiva. El estado del chat queda local a la página, no es seam.
- **Guion en 3 bloques fijos (~10 preguntas):** negocio en una tarjeta (únicos requeridos: nombre + teléfono o email), ancla en cinco tarjetas sí/no con conteos, crecer multi-tilde. Rama única con ejemplos rotando por vertical; los siempre-incluidos (Contactos, Plataforma, Puente Factura) se informan, no se preguntan; fiscal siempre como borrador con contador.
- **Bidireccional por construcción:** el "sí" marca el objeto en vivo y el pick del mueble abre su pregunta con foco; el "no" deja el objeto fantasma. Borrador vivo renderizado tras cada respuesta.
- **Contrato WhatsApp (del prototipo de decisión):** destino `wa.me` al comercial con texto codificado (saludo + negocio + rubro + contacto, módulos con conteos en criollo, comprobantes + contador, futuros, siempre-incluidos, cierre "borrador no vinculante, te paso el JSON para el Descubrimiento"), ~460 caracteres de texto; el JSON v1 viaja por copiar en el mismo chat; gate de validación mínima con error junto al campo.
- **Traducción borrador → Configurador (del contrato T3):** síes más siempre-incluidos a módulos tildados; rubro a vertical; productos aprox a SKU; cajas, almacenes, usuarios, sucursales y listas a sus campos; sin anexo fiscal (el portal nunca trae anexo firmado, el gate fiscal lo cierra el consultor).
- **Handoff consultor en 3 pasos:** leer, importar y archivar como negocio-fecha; confirmación inmediata en portal más invitación al Descubrimiento en 24h hábiles; al Descubrimiento entra validar conteos, cerrar anexo fiscal y emitir Lista cerrada más Informe más Propuesta; lo demás queda como conteo que alimenta sin reemplazar; salida anticipada intacta.
- **Layout y robustez:** split en desktop, apilado en mobile, densidades conmutables por URL; fallback paritario sin WebGL por botones más lista de teclado; `prefers-reduced-motion` quieto; layout reservado contra CLS; estado del paso en URL.
- **Blindaje comercial en 3 capas en criollo:** cinta del portal, cierre del mensaje y primera respuesta; prohibidas las frases de oferta, precio de ancla o add-ons, "presupuesto cerrado" e "incluye todo"; la confirmación dice "borrador", nunca "presupuesto".

## Testing Decisions

- **Qué hace un buen test aquí:** probar comportamiento externo a través de los seams, sin browser ni WebGL: un test arma respuestas fake del guion, construye el borrador y aserta partición ancla/futuros, suma de horas, flag no-vinculante y traducción a `generar` (gate fiscal sin anexo, limpio con anexo).
- **Seams testeados (en orden de altura):** mapping extendido con guion y gate (test surface, cubre >90%); `generar` con la traducción como input (lista cerrada, precio, marca blanca sin técnicos en la propuesta); drift del generado (tipos TS contra SSOT).
- **Prior art:** tests de lógica del Configurador (gates fiscal/módulo, techo de horas, tope SKU) y tests del mapping (partición, suma, persistencia); el ejemplo de verificación sigue su misma forma de input.

## Out of Scope

- Auto-creación del Tenant desde el portal o el chat.
- Self-service vinculante que reemplace el Descubrimiento pago o el Configurador interno.
- Precio automático de ancla o add-ons en portal, mensaje o confirmación.
- Cierre del anexo fiscal en el portal.
- Profundidad de segundo nivel por add-on de crecer (va en esfuerzo posterior, niebla del mapa).
- Persistencia del borrador más allá del browser y autenticación del Prospecto.
- Métricas de drop-off del chat.
- E-commerce, CRM, MRP, multi-sucursal, B2B avanzado dentro del ancla.
- Migración del adapter de deploy; cambios a Infra Multi-DB, Control Plane o Grafo GitNexus.

## Further Notes

- Abierto que refina sin invalidar: verificación interactiva en browser del prototipo y la página (compilación verificada 2026-09-09: `/oficina`, `/oficina-chat` y `/prototype/oficina-chat` devuelven 200 con `npm install` completo; falta el clic real con `three` en pantalla) y re-corrida del ejemplo con Python funcional antes del build real.
- Research previo en rama `research/oficina-chat-livebuild`; prototipo descartable en ruta `/prototype/oficina-chat` con densidades por URL.
- Publicación pendiente: crear el issue GitHub con este contenido y aplicar label `ready-for-agent` al tener `gh auth login`.
