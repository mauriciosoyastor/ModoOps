# ModoOps — Sistema de Gestión Modular

Contexto de negocio para **ModoOps** (evolución de Consultoría Matasini) en Argentina: qué se vende, qué queda explícitamente fuera, y cómo se nombran los límites para alinear propuestas, contratos y trabajo. ModoOps es **marca blanca comercial**: el cliente contrata "ModoOps", la implementación corre sobre **Odoo CE 19** (explícito solo en anexo técnico/licencia).

> Origen: práctica independiente validada en **Servigas (Caso ModoOps Retail)** — retail mostrador, Odoo 19 Community + Astro BFF + Liquid Glass v2.

## Language

### Comercial y precios

**Moneda de cotización**:
Honorarios expresados por defecto en **USD** (dólares estadounidenses). **ARS** solo si el **Cliente** lo solicita, con tipo de cambio definido al momento de facturar.
_Avoid_: mezclar monedas en la misma propuesta sin tipo de cambio claro.

**Revisión de honorarios**:
Precios en **USD** se mantienen estables; **ARS** (si aplica) se ajusta por **índice de inflación** acordado (fórmula en anexo). **Proyectos en curso** (ej. **Paquete ancla** ya firmado): precio **congelado** hasta el cierre. **Abono mensual** y **nuevos** contratos: se actualizan en **renovación** o nueva contratación según índice/moneda.
_Avoid_: aumentar mitad de un proyecto fijo; abono multi-año sin cláusula de revisión.

**Tarifa diaria de consultoría**:
Referencia interna: **$52 USD/día** (jornada de **6 h** facturables). Se usa para calcular paquetes; no es obligatorio publicarla.
_Avoid_: mezclar tarifa diaria con **Abono mensual** sin convertir unidades (día vs mes).

**Precio del Descubrimiento pago**:
**$155 USD** precio fijo (3 días × tarifa diaria interna, redondeo comercial). **Extensión:** **$52 USD** por cada jornada adicional. Es un servicio **distinto** del **Paquete ancla**; no se asume descuento automático total.
_Avoid_: días extra sin cobrar o sin entregable actualizado.

**Crédito por cierre del ancla**:
Si el **Prospecto** firma el **Paquete ancla** dentro de la **Validez de la propuesta** (**20 días**), se acredita **50%** del **Descubrimiento pago** (**$77.5 USD**) al **anticipo** del ancla (el otro 50% del descubrimiento no se descuenta).
_Avoid_: “descubrimiento gratis si contratás”; crédito sin fecha límite.

**Tarifa hora adicional**:
**$10.5 USD/h** para **Cambio**, horas fuera de bolsa/abono y trabajo no incluido en el **Techo de horas del proyecto** (~+20% sobre tarifa hora base del día).
_Avoid_: aplicar tarifa de bolsa a cambios de alcance; regalar horas post-techo en ancla.

**Política de precios públicos**:
En web y PDF: solo se publica el **Precio del Descubrimiento pago** (**$155 USD**). **Paquete ancla** y **Abono mensual**: “a medida tras diagnóstico” (montos de referencia internos en propuesta, no en carta pública). El **Crédito por cierre del ancla** no se publica en landing/PDF (solo en propuesta o charla comercial).
_Avoid_: publicar $800, $45 o $77.5 de crédito en landing si el alcance aún se cierra en descubrimiento.

**Meta de ingreso (fase inicial ModoOps)**:
Objetivo de facturación: **$600 USD/mes** durante los **primeros 6 meses**, con revisión **trimestral al alza** según demanda y **Capacidad de entrega** (red a demanda, máx 2 anclas en paralelo); no es un precio de lista, es meta operativa. Tras validar 2 anclas + 2 abonos, revisar escala.
_Avoid_: asumir que un solo **Paquete ancla** por mes cubre solo la meta sin otros ingresos (abonos, descubrimientos, add-ons).

**Cliente**:
Organización con la que hay contrato vigente y entornos acordados (staging/producción).
_Avoid_: usar “cliente” para prospectos sin contrato.

**Prospecto**:
Organización en conversación previa a contrato; el alcance no está congelado hasta firmar.

**ModoOps**:
Marca comercial de sistema de gestión modular. En marketing y propuesta comercial **no se menciona Odoo**; en **anexo técnico y licencia** se explicita que ModoOps corre sobre **Odoo CE 19** + módulos validados. Operativos viven en **Shell Astro BFF + Liquid Glass** sin exponer UI Odoo nativa.

**Módulo ModoOps**:
Unidad comercial renombrada que envuelve uno o más módulos Odoo validados (ej: Odoo `point_of_sale` → ModoOps **"Mostrador"**, `stock` → **"Depósito Inteligente"**, `l10n_ar` → **"Fiscal AR"**). Solo los módulos del **Catálogo ModoOps** son ofrecibles sin add-on de evaluación.

**Catálogo ModoOps**:
Mapa vivo de **Módulos ModoOps validados** que ModoOps domina y ofrece. Es el universo ofrecible: "todo lo que ofrece Odoo" = **todo lo que está en el Catálogo ModoOps**. Crece solo cuando se valida un módulo en proyecto real. No es "todo OCA" sin filtro. Ver sección *Catálogo canónico* abajo (renombrado).

**Ancla ModoOps**:
Combo base cerrado por vertical (ej: Retail = Mostrador+Depósito+Compras+Fiscal) con **precio fijo + techo de horas**. Modelo **híbrido** (anticipo + hitos + techo). Módulos extra = **Add-on** a la carta vía configurador interno.

**Composable / Configurador ModoOps**:
Herramienta **interna** ModoOps para armar propuestas: tildar Módulos ModoOps del Catálogo → genera alcance, lista cerrada, precio ancla/add-on y checklists. No es self-service del cliente en fase inicial.

**Paquete ancla**:
Implementación ModoOps (Odoo CE 19 por defecto) con alcance cerrado, hitos y exclusiones explícitas. **Precio fijo:** **$800 USD** con modelo **híbrido** (anticipo + hitos + **techo de horas** de proyecto; exceso = **Cambio** cotizado).
_Avoid_: “implementación completa”, “todo Odoo”, “proyecto llave en mano” sin lista de exclusiones.

**Techo de horas del proyecto**:
Máximo de horas de consultoría incluidas en el **Paquete ancla** (~**92 h**, equivalente a ~**15,5 días** × 6 h a tarifa interna); por encima: **Cambio** o **Add-on** según contrato.
_Avoid_: proyecto sin tope cuando el precio es fijo.

**Estructura de cobro del ancla**:
**50%** anticipo (**$400.000 ARS**) para iniciar; **25%** (**$200.000**) al hito núcleo en staging; **25%** (**$200.000**) al go-live + hipercare. Hitos solo se pagan al cumplir criterios de aceptación.
_Avoid_: cobrar hitos sin aceptación formal.

**Fase 1**:
Implementación del núcleo operativo retail acordado en Odoo CE, sin B2B avanzado ni integraciones externas. Canal de venta del ancla: **Punto de venta (POS)** como principal.
_Avoid_: prometer POS + B2B avanzado + e-commerce en Fase 1.

**Punto de venta (POS)**:
App de caja/mostrador para ventas presenciales; canal de venta incluido por defecto en el **Paquete ancla** retail (hasta **2 cajas** en 1 sucursal).
_Avoid_: usar “ventas” genérico cuando el alcance es solo backend sin TPV; ilimitar cajas sin cotizar.

**Variantes básicas (producto)**:
Productos con atributos limitados (default: hasta **2 atributos** por plantilla de producto); adecuado a retail pinturería sin explosión de combinaciones.
_Avoid_: “variantes ilimitadas” en el ancla; matrices de cientos de SKUs sin migración/add-on.

**Fase 2**:
Trabajo posterior al go-live para integraciones externas y ampliaciones acotadas por contrato aparte.

**Add-on**:
Paquete de trabajo con precio y entregables propios, fuera del ancla (ej.: B2B, migración de datos, fiscal fuera del estándar acordado). **Precio por defecto:** **SKU fijo** cuando el alcance es repetible; si no calza, **días × tarifa diaria**; micro-trabajos o desborde puntual: **Tarifa hora adicional** (**$10.500/h**).
_Avoid_: add-on sin entregable ni tope; mezclar add-on con horas del ancla.

**Migración catálogo** (add-on):
SKU: importación de **catálogo** (hasta **500** productos) + **stock inicial** acordado en plantilla; **$155 USD** fijo; validación en staging. Supera tope o datos muy sucios: tramo extra o **días × tarifa diaria**.
_Avoid_: incluir años de histórico o clientes ilimitados en este SKU.

**B2B básico** (add-on):
SKU post-**Fase 1**: ventas B2B con **cuenta corriente** y condiciones comerciales **básicas** (alcance cerrado en propuesta; sin multi-lista “científica” ni crédito complejo). **$155 USD** fijo.
_Avoid_: incluir B2B avanzado en el **Paquete ancla**; prometer crédito/reglas complejas en “básico”.

**Fiscal fuera del estándar** (add-on):
Trabajo fiscal más allá del **Estándar fiscal del ancla**; se cotiza en **días × tarifa diaria** (**$52 USD/día**) tras descubrimiento y validación del **Asesor fiscal del Cliente**; sin SKU fijo en fase inicial.
_Avoid_: precio fijo fiscal genérico antes de conocer régimen y comprobantes.

**Integración Fase 2** (add-on):
Conexión con un sistema externo (una integración = un alcance acotado). Precio: **días estimados × $52 USD/día**; **mínimo 2 días** (**$104 USD**) por integración simple. Integración compleja: descubrimiento o estimación ampliada antes de comprometer.
_Avoid_: “de paso integramos” dentro del ancla; integraciones ilimitadas por un solo día.

**Techo de ajustes técnicos**:
**8 horas** incluidas en el **Paquete ancla** para ajustes menores en Odoo (vistas, campos simples, automatizaciones livianas, parametrización fina); no sustituye un módulo a medida.
_Avoid_: “desarrollo incluido” sin tope; tratar un módulo nuevo como “ajuste menor”.

**Desarrollo a medida**:
Módulos, integraciones por código o cambios que superan el **Techo de ajustes técnicos**; siempre **Add-on** o **Cambio** cotizado.
_Avoid_: mezclar **Desarrollo a medida** con **Bug** o con configuración estándar.

**Lista cerrada de módulos (ModoOps)**:
Conjunto de **Módulos ModoOps** (apps Odoo CE renombradas) y localización **nombrados en contrato** que ModoOps instala y mantiene dentro del ancla; se completa en **Descubrimiento pago** vía **Configurador ModoOps** (o anexo técnico firmado antes de Fase 1). Solo puede salir del **Catálogo ModoOps** salvo **Add-on** explícito.
_Avoid_: “si hace falta instalamos algo”; módulos sin nombre ni versión; prometer módulos no listados en el catálogo.

**Catálogo canónico de módulos → Catálogo ModoOps**:
Lista viva en este repo de **Módulos ModoOps validados** que ModoOps **domina y ofrece** (ej: Mostrador, Depósito Inteligente, Fiscal AR); no es el contrato del Cliente hasta que se copia a la **Lista cerrada de módulos** del proyecto. "Todo Odoo" = todo el Catálogo ModoOps, no todo OCA.
_Avoid_: confundir el catálogo con “todo lo que existe en OCA”.

**Descubrimiento pago**:
Paquete corto (default **3 días**, extensible) que produce **Informe de diagnóstico** + **Propuesta comercial** con alcance, riesgos y re-cotización cuando corresponde. Se **vende a precio fijo** en **USD**; el monto se **calcula internamente** como **tarifa diaria × días** (no se expone la tarifa diaria al **Prospecto** salvo que lo pidan).
_Avoid_: “reunión gratis infinita” como sustituto de descubrimiento; días extra sin recotizar.

**Informe de diagnóstico**:
Documento entregable del **Descubrimiento pago** (separado de la propuesta) con secciones obligatorias: (1) resumen ejecutivo, (2) contexto y objetivos, (3) proceso actual, (4) ajuste al **ICP**, (5) gaps vs ancla, (6) riesgos, (7) recomendación técnica CE/EE y versión, (8) anexos a cerrar pre-Fase 1, (9) próximos pasos.
_Avoid_: informe solo comercial sin riesgos; omitir anexos fiscales/técnicos pendientes.

**Propuesta comercial**:
Documento separado con las **10 secciones obligatorias** (alcance, exclusiones, precio/hitos, plazo, add-ons, supuestos, soporte, validez **20 días**, próximo paso).
_Avoid_: mezclar solo precio sin exclusiones; duplicar todo el informe en la propuesta.

**Validez de la propuesta**:
**20 días** desde emisión; pasado ese plazo, precios y plazos pueden requerir **re-cotización** (especialmente si se cotizó en ARS con índice).
_Avoid_: propuesta abierta sin fecha límite.

**Agenda de descubrimiento**:
Plan de **3 jornadas** (día 1 proceso, día 2 fiscal/datos/infra, día 3 cierre y entregables); **jornada extra:** **$52 USD** con entregables actualizados.
_Avoid_: descubrimiento sin entregables fechados al día 3.

**Salida anticipada del descubrimiento**:
Si en **día 1** el **Prospecto** **no encaja el ICP** (complejidad alta, multi-sucursal, etc.), se **corta** el paquete: **Informe de diagnóstico** acotado + propuesta de **re-cotización** (sin prometer **Paquete ancla** a **$800**). No se “completan” automáticamente los 3 días.
_Avoid_: forzar ancla estándar cuando ya se detectó desvío fuerte de alcance.

**Hito**:
Momento de aceptación formal con criterios verificables que destraba un pago. **Hito 1 — núcleo en staging** y **Hito 2 — go-live + hipercare** tienen checklists en *Alcance funcional del ancla*.

**Go-live**:
Puesta en producción en el ambiente del cliente con checklist mínimo acordado; incluido en el ancla una vez.
_Avoid_: confundir go-live con “fin del soporte” o con “hipercare ilimitado”.

**Hipercare**:
Ventana acotada post go-live para corrección de incidentes según severidad acordada (10 días hábiles: alta + media sin workaround).
_Avoid_: llamar “hipercare” a cambios funcionales o mejoras.

**Cambio**:
Ajuste de proceso, alcance o comportamiento no cubierto por el contrato vigente; se cotiza.
_Avoid_: mezclar cambios con bugs o con “capacitación extra”.

**Bug**:
Comportamiento incorrecto respecto del alcance aceptado y documentado; se trata según severidad dentro de hipercare o soporte según reglas.

**Soporte**:
Asistencia continua post **Hipercare**; **modalidad por defecto:** **Abono mensual** (retainer) para **Clientes** en producción, con canal oficial y reglas anti-abuso. Reactivo o prepago solo si se acuerda explícitamente en contrato.
_Avoid_: soporte “a demanda informal” sin abono ni reglas; mezclar **Soporte** con **Hipercare**.

**ICP** (*Ideal Customer Profile*):
Perfil de cliente objetivo para el ancla: Argentina primero; 1 sucursal; ~5 usuarios; complejidad baja.
_Avoid_: prometer el mismo ancla a multi-sucursal o alta complejidad sin re-cotización.

**Capacidad de entrega (ModoOps)**:
Límite operativo ModoOps: **hasta 2 implementaciones activas en paralelo** vía **red de colaboradores a demanda** + arquitecto (vos). **15–18 h/semana** facturables por ancla; los plazos del ancla se calculan en función de esta capacidad. Supera 2: replanificar o contratar.
_Avoid_: comprometer 3+ anclas en paralelo sin red validada; prometer plazos de agencia con dedicación part-time sin explicitarlo.

**Implementación activa**:
Proyecto de **Fase 1** (o equivalente) en curso con trabajo facturable semanal reservado; no incluye solo **Soporte** liviano salvo que se defina como no activo en contrato.
_Avoid_: contar dos Fase 1 en paralelo como “una implementación”.

**Transición a dedicación full time**:
Decisión de dejar el empleo de mañana y dedicarse 100% a ModoOps cuando se cumplen **ambos**: runway de **6 meses de gastos mínimos** ahorrados y **2–3 Clientes** en producción con **Abono mensual** de **Soporte** activo (recurrencia, no solo proyectos puntuales).
_Avoid_: saltar por un solo pago grande sin runway ni clientes en producción.

**Abono mensual**:
Cuota fija mensual de **Soporte** post-hipercare: **$45 USD/mes**; incluye **4 horas/mes** en bolsa (soporte operativo y ajustes menores acordados) + **best effort** en horario comercial para **bugs** dentro del alcance aceptado; todo **Cambio** queda fuera y se cotiza. Horas de bolsa **no usadas vencen** al cierre del mes (no acumulan).
_Avoid_: abono sin tope para cambios; tratar mejoras como bugs “porque paguen abono”.

**Mes de transición de soporte**:
Primer mes calendario completo después de **Hipercare**: **best effort** en horario comercial (sin bolsa de horas); reglas de canal, **Cambio** cotizado y emergencias acotadas igual que en **Soporte**. Desde el **mes 2** en producción, el **Abono mensual** es **obligatorio** para **Soporte** continuo.
_Avoid_: bolsa de horas “gratis” en transición; soporte informal indefinido sin abono.

**Soporte continuo**:
Atención post-hipercare fuera de proyectos puntuales; requiere **Abono mensual** activo desde el mes 2. Sin abono: solo **Add-on**, **Cambio** cotizado o nuevo proyecto — no atención reactiva “a demanda”.
_Avoid_: WhatsApp ilimitado sin contrato de abono tras la transición.

**CE / EE**:
Community vs Enterprise; el consultor implementa y soporta; el cliente licencia Odoo.

**Estándar fiscal del ancla**:
Conjunto **cerrado y anexo al contrato** de tipos de comprobantes, casos de uso y parametrizaciones fiscales incluidas dentro del **Paquete ancla** para el flujo retail acordado.
_Avoid_: “lo habitual”, “lo estándar de mercado”, “lo que salga” sin anexo firmado.

**Cierre del anexo fiscal**:
Momento en que el anexo fiscal queda **firmado por el Cliente** tras **validación del asesor fiscal del Cliente**, y se cumple la **Aceptación fiscal en staging**; obligatorio **antes del go-live** y **antes de la primera emisión fiscal real**, aunque Fase 1 en staging pueda avanzar antes.
_Avoid_: que el consultor “apruebe” regímenes fiscales sin asesor del Cliente; cerrar fiscal solo con “configurado” sin prueba de emisión.

**Aceptación fiscal en staging**:
Checklist en staging/homologación acordada: emitir (y, si el anexo lo incluye, anular o nota de crédito) cada tipo de comprobante listado en el anexo fiscal, sin usar producción como laboratorio.
_Avoid_: “está configurado”; primera prueba real solo en producción como condición de cierre fiscal.

**Asesor fiscal del Cliente**:
Contador o estudio que valida tipos de comprobante, regímenes y obligaciones; no es el consultor Odoo.
_Avoid_: usar “contador” para el consultor de implementación.

**Entorno fiscal de prueba**:
Homologación / credenciales / puntos de venta de prueba y habilitaciones del lado AFIP/ARCA provistos por el **Cliente** (o su **Asesor fiscal del Cliente**); el consultor configura y prueba Odoo contra ese entorno.
_Avoid_: asumir que el consultor tramita certificados o habilitaciones oficiales dentro del ancla.

**Demora fiscal del Cliente**:
Retraso atribuible al Cliente o a su asesor en cerrar el anexo fiscal o habilitar el **Entorno fiscal de prueba**, que desplaza el **Go-live** planificado.
_Avoid_: tratar la demora como incumplimiento del consultor o como hipercare automático.

**Ventana de coordinación fiscal**:
Período incluido en el ancla (default **2 semanas hábiles** desde el hito de staging) para coordinar cierre fiscal y pruebas; pasada esa ventana, el seguimiento por demora del Cliente se cotiza como **Cambio** o bolsa de horas.
_Avoid_: coordinación ilimitada “hasta que AFIP responda”.

**SLA de infra**:
Compromiso medible de disponibilidad/respuesta sobre hosting/red del cliente; explícitamente fuera por defecto.

**Infra ModoOps Centralizada (Multi-DB)**:
Servidor central Hetzner/DO 8–16GB con Docker Odoo + Postgres central. Cada **Tenant = Cliente** → base `modoops_<cliente>` aislada. Selección de Módulos ModoOps (incluida IA `modoops_ia`) vía Configurador → `odoo-bin -d <tenant> -i <módulo>` en su base.

**Fase 1 (hoy, 0–10 tenants):** Backups nightly por tenant a S3/Storage Box + snapshot diario VPS + filestore en S3. RPO 24h / RTO 60min. Sin réplica hot standby. Costo ~$40/mes.
**Fase 2 (10+ tenants, >$400/mes recurrente):** Hot Standby con Streaming Replication + Floating IP ($78/mes total). RPO ms / RTO 2–5min.
_Avoid_: prometer multitenant single-DB con tenant_id; confundir tenant con usuario Odoo.

**Tenant**:
Cliente aislado en infra central (una base Postgres `modoops_<cliente>`). No es usuario ni sucursal. Ver **Infra Centralizada**.

**Control Plane ModoOps (`modoops_admin`)**:
Módulo Odoo en base `modoops_master` (mismo VPS/ Postgres) que centraliza gestión de todos los Tenants: lista, instalar/quitar Módulos ModoOps del Catálogo, ver logs, suspender/reactivar. No es la base del Cliente. Vive en `modoops_core` → `modoops_admin` (Fase 1).

**Estado Tenant**:
`Activo` (opera normal) → `Suspendido` (login bloqueado, solo lectura, tras gracia) → `Baja` (backup y cierre). Transición por **Suspensión por mora**.

**Suspensión por mora**:
Bloqueo de acceso Tenant por falta de pago Abono $45/mes. Regla: **gracia 7 días** con aviso WhatsApp/email, luego `Suspendido` (no borra DB), a los 15 días backup final y baja. No es corte día 1.

**Emergencia (WhatsApp)**:
Incidente que impide vender o emitir comprobantes por falla atribuible al trabajo entregado; fuera de horario comercial solo si se definió así por escrito.

### Agentes IA (ModoOps IA — `modoops_ia`)

**Agente ModoOps**:
Proceso herramental que resuelve una tarea invocando **Herramientas ModoOps** dentro de un único **Tenant**. El chat es solo UI sobre el mismo Agente.
_Avoid_: "agente" genérico sin Tenant, "chatbot" con escrituras directas, agente multi-tenant.

**Herramienta ModoOps (Tool)**:
Unidad invocable por un Agente que envuelve una operación Odoo con contrato cerrado (`input_schema` + permisos `groups_id` + auditoría). No es **Add-on** ni **Integración Fase 2** ni `ir.actions`.
_Avoid_: Add-on, Integración, Acción, Skill.

**Orquestador ModoOps (BFF Astro)**:
Aduana obligatoria entre Agente y Odoo. Valida api_key por Tenant, enforza **Contexto Tenant**, rate-limit, y audita en `modoops.tenant.log` antes de tocar Odoo.
_Avoid_: Odoo expuesto directo a IA con `auth='public'` o cookie de sesión, bypass del BFF.

**Contexto Tenant**:
Par `db_name` + `tenant_id` inyectado en toda invocación IA que fija el cursor ORM a `modoops_<slug>`. Sin él no hay ejecución.
_Avoid_: `user_id` suelto, cursor implícito, agente sin `db_name`.

**Grafo GitNexus ModoOps**:
Índice local `.gitnexus/` del repo ModoOps con capas `graph + FTS (ladybugdb-fts) + vectorSearch/embeddings` (modelo local `snowflake-arctic-embed-xs`, **384 dims** congeladas, ~90 MB modelo / +2–5 MB índice) consumible por el agente IA vía MCP (`query` → `context` → `impact` → `cypher`), offline-first, reindex con `npx gitnexus analyze --force --embeddings`; `fts/vector: available` + `Semantic mode: vector` + `stats.embeddings>0` + `embeddingDims==384` es el criterio de paridad. Sin `--pdg` en MVP (fog). Plantilla reutilizable si un tenant requiriera grafo propio.
_Avoid_: dims distintas sin ADR + reindex; `--pdg` como requisito de paridad MVP; grafo por tenant como infra multi-DB hoy.

**Catálogo de Herramientas IA**:
Conjunto vivo de Herramientas validadas por ModoOps, definido en `modoops_master` y ejecutado siempre en la DB del Tenant. Las credenciales externas (ej: API key MercadoPago del Cliente) se resuelven en el Tenant ejecutante, no en el catálogo central.
_Avoid_: credenciales de Tenant en master, herramienta sin dueño Tenant.

**Memoria del Agente**:
Historial y preferencias del Agente persistidas en la DB del Tenant (`modoops_<slug>`), cifrada y con retención purgable (default 90 días). Nunca en `modoops_master`.
_Avoid_: memoria centralizada cross-tenant, PII en logs del BFF o en master.

**Ejecución del Agente (Corrida)**:
Invocación única auditada `BFF → Tenant` con `Contexto Tenant` + `tool` + `input` → `output` + `modoops.tenant.log`. Una corrida invoca una Herramienta; una tarea puede requerir N corridas.
_Avoid_: corrida sin `db_name`, corrida multi-tenant, ejecución directa sin log.

**Falla cerrada / Modo borrador**:
Si no existe Herramienta para la tarea, el Agente no improvisa escrituras; genera borrador revisable (CSV/preview) o deriva a humano vía `mail.activity`. Si hay valor, se cotiza como **Cambio** o **Add-on**.
_Avoid_: `env['model'].write` sin Herramienta, hallucinar faltante como éxito, auto-escalar a `group_system`.

**Techo IA**:
Cuota mensual de ejecuciones/tokens incluida en el **Abono mensual** y enforzada en el **Orquestador** antes de tocar Odoo. Exceso bloquea o requiere **Add-on IA** / bolsa a **Tarifa hora adicional**.
_Avoid_: IA ilimitada dentro del abono, costo LLM sin contador, bypass del Orquestador.

**Namespace `modoops.*` vs `mo.*`**:
Todo código IA nuevo nace en `modoops.*` (`modoops.agent`, `modoops.agent.tool`, `modoops_ia/logic/` puro sin ORM + wrapper). `mo.*` queda como legacy Servigas congelado.
_Avoid_: `mo.agent`, mezclar lógica pura con ORM en el mismo archivo, nuevo código en `mo.*`.

## Relationships

- Un **Prospecto** puede contratar un **Descubrimiento pago** antes del **Paquete ancla**.
- El **Paquete ancla** (ModoOps) pertenece a un **Cliente** y se compone de **Fase 1** + **Go-live** + **Hipercare** + capacitación incluida (6 h) + **Techo de ajustes técnicos** (8 h), dentro del **Techo de horas del proyecto** (~92 h) y precio **$800 USD** (modelo híbrido; vertical define combo base vía **Catálogo ModoOps**).
- **Fase 2** depende de un **Cliente** con **Go-live** completado salvo acuerdo explícito en paralelo.
- Un **Add-on** (B2B, migración, fiscal avanzada, integraciones) no forma parte del **Paquete ancla** salvo lista explícita firmada.
- El **Paquete ancla** incluye un **Techo de ajustes técnicos** de **8 horas**; lo que lo excede es **Desarrollo a medida** (**Add-on** / **Cambio**).
- El **Paquete ancla** solo incluye **Módulos ModoOps** de la **Lista cerrada de módulos** acordada; la lista se cierra en **Descubrimiento pago** vía **Configurador ModoOps**; módulos ⊆ **Catálogo ModoOps** salvo **Add-on**.
- El **Estándar fiscal del ancla** es un subconjunto explícito del alcance: lo no listado en el anexo fiscal se trata como **Add-on** o requiere **Descubrimiento pago** previo.
- **Fase 1** en staging puede avanzar (catálogo, stock, compras, POS) **antes del Cierre del anexo fiscal**, pero **Go-live** y emisión fiscal real quedan bloqueados hasta ese cierre.
- El **Cierre del anexo fiscal** requiere **validación del Asesor fiscal del Cliente** + **firma del Cliente** + **Aceptación fiscal en staging**; el consultor implementa según el anexo acordado, sin rol de asesoría fiscal.
- **Go-live** no procede sin **Cierre del anexo fiscal** completado.
- La **Aceptación fiscal en staging** depende de que el **Cliente** provea el **Entorno fiscal de prueba**; demoras por trámites del Cliente no son alcance implícito del consultor.
- Ante **Demora fiscal del Cliente**: **replanificación del Go-live** sin penalidad al consultor; los **Hitos** se pagan solo al cumplir criterios; aplica **Ventana de coordinación fiscal** y luego trabajo cotizado.
- **Cambio** no consume **Hipercare** salvo acuerdo explícito; **Bug** sí según severidad y ventana; **Cambio** y horas fuera de techo se facturan a **Tarifa hora adicional** (**$10.5 USD/h**) salvo **Add-on** con precio fijo.
- **Soporte** sucede a **Hipercare** y no incluye por defecto **SLA de infra**.
- Tras **Hipercare** aplica **Mes de transición de soporte**; desde el mes 2, **Soporte continuo** exige **Abono mensual** (**$45 USD/mes, 4 h/mes** + best effort para **bugs**; **Cambio** cotizado). Sin abono: solo trabajo contratado puntual.
- **ModoOps es marca blanca comercial**: en marketing/propuesta no se menciona Odoo; en anexo técnico/licencia sí se lista Odoo CE 19 + Módulos ModoOps. El **Catálogo ModoOps** es el universo ofrecible.
- **Infra Centralizada Multi-DB**: 1 VPS central → N tenants (bases `modoops_<cliente>` aisladas). Fase 1 backups/S3, Fase 2 hot standby. Selección de módulos (incluida IA) por tenant vía Configurador + **Control Plane**.
- **Control Plane**: `modoops_admin` en base `modoops_master` gestiona Tenants; no es base de Cliente. Suspensión por mora con gracia 7 días.
- **Agente ModoOps** opera solo vía **Orquestador** con **Contexto Tenant**; cada **Herramienta** es invocada en una **Ejecución** auditada en `modoops.tenant.log`.
- **Catálogo de Herramientas IA** vive en `modoops_master`; la **Memoria** vive en el Tenant; ambas respetan **Suspensión por mora** (suspendido = BFF bloquea corridas).
- Sin **Herramienta** no hay escritura: aplica **Falla cerrada / Modo borrador** y eventual **Cambio/Add-on**.
- **Techo IA** se enforza en el Orquestador y protege el margen del **Abono mensual**; exceso no consume **Hipercare**.
- Código IA respeta **Namespace `modoops.*` vs `mo.*`**: lógica pura en `modoops_ia/logic/` (sin ORM, como `mo_price_list_import_logic.py:1`) + wrapper Odoo.

## Example dialogue

> **Cliente:** “De paso conectemos Mercado Libre y la balanza.”  
> **Consultor:** “Eso es **Fase 2** / **Add-on**: lo cotizamos aparte para no mezclar el **Paquete ancla**.”

> **Cliente:** “El servidor se cayó, ¿cuándo lo arreglás?”  
> **Consultor:** “Primero confirmamos si es **infra** del proveedor del **Cliente** o **Bug** de Odoo/config. Sin **SLA de infra**, mi rol es diagnóstico y coordinación; el arreglo de hosting lo ejecuta el dueño del servidor.”

> **Prospecto:** “¿Incluye migrar 5 años de historial?”  
> **Consultor:** “No: la **migración de datos** es **Add-on** con estimación; el **ancla** incluye plantillas y criterios, no ETL histórico.”

> **Cliente:** “¿Percepciones y retenciones raras van?”  
> **Consultor:** “Solo si están en el **anexo fiscal** del **Estándar fiscal del ancla**. Si no, es **Add-on** o va a **Descubrimiento pago**.”

> **Cliente:** “¿Podemos ir cargando productos mientras definimos AFIP?”  
> **Consultor:** “Sí en **staging**; el **Cierre del anexo fiscal** es obligatorio antes del **Go-live** y de emitir comprobantes reales.”

> **Cliente:** “¿Vos nos decís qué facturas usar?”  
> **Consultor:** “Redactamos el borrador del anexo; lo valida su **Asesor fiscal del Cliente** y ustedes firman. Yo implemento Odoo según eso, no reemplazo al contador.”

> **Cliente:** “¿Sacamos nosotros los certificados de AFIP?”  
> **Consultor:** “Sí: el **Entorno fiscal de prueba** lo proveen ustedes o su contador; yo configuro Odoo y ejecutamos la **Aceptación fiscal en staging**.”

> **Cliente:** “AFIP demoró un mes, ¿igual es go-live esta semana?”  
> **Consultor:** “El **Go-live** se replanifica; no es incumplimiento mío. Incluyo la **Ventana de coordinación fiscal**; después, el seguimiento extra se cotiza.”

> **Cliente:** “¿Podemos seguir consultando por WhatsApp sin abono?”  
> **Consultor:** “El primer mes post-hipercare es **Mes de transición de soporte**. Desde el mes 2, **Soporte continuo** requiere **Abono mensual**; si no, solo trabajos cotizados.”

## Alcance funcional del ancla (Odoo CE — retail)

**Versión:** 17 o 18 (según **Lista cerrada de módulos** del proyecto).

### Apps incluidas

| App Odoo | Alcance en ancla |
|----------|------------------|
| **Punto de venta (POS)** | Hasta **2 cajas** (configuraciones POS) en **1 sucursal**; canal de venta principal |
| **Ventas** | Flujo ligado a POS / facturación operativa |
| **Inventario** | **1 almacén**; stock, recepciones/entregas básicas |
| **Compras** | Proveedores; órdenes de compra básicas |
| **Contabilidad** | Operativa vinculada a ventas/compras POS (**no** cierre contable mensual del estudio) |
| **Contactos** | Clientes y proveedores básicos |
| **Localización Argentina** | Según módulos exactos en lista del proyecto (post-descubrimiento) |

### Apps excluidas (salvo add-on o Fase 2)

**CRM**, **Sitio web / eCommerce**, **Manufactura (MRP)**, **B2B avanzado**, **multi-almacén / multi-sucursal**, **integraciones externas**.

### Parametrización incluida (ICP)

- Hasta **2** configuraciones **POS** (cajas) en la misma sucursal
- **1** lista de precios de venta (promos simples acordadas en descubrimiento)
- **Usuarios y permisos** base (perfiles acordados; ~5 usuarios ICP)
- **Catálogo de productos** con **variantes básicas** (hasta **2 atributos** acordados en descubrimiento, ej. volumen + color); sin matrices masivas de SKU
- Carga manual en ancla o vía **Migración catálogo** add-on (tope 500 ítems)
- **Techo de ajustes técnicos:** 8 h (vistas/campos/automatizaciones menores)

### Criterios de aceptación — Hito 1 (núcleo en staging, 25%)

Checklist en **staging**; aceptación formal del **Cliente** destraba **$200 USD** (25% de $800):

1. Apps del ancla instaladas (CE 17/18 según contrato).
2. **Catálogo** con **variantes básicas** cargado (muestra piloto o **Migración catálogo** si contratada).
3. **Compras:** orden de compra → recepción en **1 almacén**.
4. **POS:** venta de prueba en **cada caja** (hasta 2); descuenta stock.
5. **Usuarios y permisos** base operativos (~5 usuarios ICP).
6. **Contabilidad operativa** en staging según alcance acordado (sin exigir comprobantes fiscales reales).
7. **No** requiere **Go-live** ni emisión fiscal en producción.

### Criterios de aceptación — Hito 2 (go-live + hipercare, 25%)

Checklist en **producción**; aceptación formal del **Cliente** destraba **$200 USD** (saldo final del ancla):

1. **Go-live** ejecutado en ambiente del **Cliente** (una puesta incluida).
2. **Cierre del anexo fiscal** cumplido + **Aceptación fiscal en staging** ya superada.
3. **POS** operativo en producción en **cada caja** acordada (hasta 2).
4. **Compras** e **inventario** operativos en producción (**1 almacén**).
5. **Capacitación:** **6 h** incluidas impartidas (o plan escrito firmado para el remanente inmediato post go-live).
6. Inicio de **Hipercare** (**10 días hábiles** según severidades acordadas).
7. Checklist mínimo de **infra** del **Cliente** revisado (backups, SSL, accesos); **sin SLA de infra** del consultor.
8. **Mes de transición de soporte** y obligatoriedad de **Abono mensual** desde mes 2 comunicados y aceptados.

## Marketing — mensaje canónico ModoOps (landing + PDF)

Mismo contenido en **landing de 1 página** y **PDF one-pager**. Solo precio público: **Descubrimiento $155 USD**; ancla y abono **tras diagnóstico** (**Política de precios públicos**). **Odoo no se menciona** en marketing; se vende "ModoOps — Sistema de Gestión Modular".

### Estructura landing / PDF (orden)

1. **Hero** — qué hacés + PYME Argentina + CTA (sin mencionar Odoo)  
2. **Problema** — operación fragmentada (stock, caja, compras)  
3. **Solución** — **ModoOps modular**: elegís los **Módulos ModoOps** que tu operación necesita (Mostrador, Depósito Inteligente, Compras, Fiscal AR, etc. — ver Catálogo ModoOps)  
4. **Camino** — Descubrimiento → Implementación ModoOps → Soporte (sin publicar $800 / abono)  
5. **Descubrimiento** — **$155 USD**, 3 días, informe + propuesta  
6. **Para quién / no para quién** — ver copy abajo  
7. **Cómo trabajamos** — hitos, licencia del cliente, sin SLA de infra  
8. **Contacto** — formulario + email + WhatsApp comercial  

**Copy listo para publicar:** `docs/marketing-one-pager.md` (secciones 1–8).  
**Diseño:** `docs/DESIGN.md` (Neuralink adaptado).  
**Implementación:** esqueleto Astro en `web/` — ver `docs/landing-architecture.md`.

### Marca

**ModoOps** — **Sistema de Gestión Modular para comercios y pymes** (evolución de Mauricio Matasini — consultoría). Implementación sobre **Odoo CE 19** + Shell Astro BFF, marca blanca comercial: Odoo no aparece en web/propuesta, sí en anexo técnico/licencia.

**Posicionamiento de producto (hoy vs futuro)**:
- **Línea de oficio (marca):** **ModoOps** — sistema modular composable (elegís Módulos ModoOps del Catálogo).  
- **Hoy (oferta concreta):** **Catálogo ModoOps inicial** validado en **Servigas (Caso Retail)**: Mostrador (POS 2 cajas), Depósito Inteligente (stock 1 almacén), Compras, Fiscal AR, Migración Excel. Otros módulos (B2B, integraciones) como Add-on/Fase 2 vía Configurador.  
- **Futuro:** Catálogo crece por vertical (servicios, distribución) según validación en proyectos reales.
_Avoid_: prometer “cualquier ERP” en el hero sin capacidad; ocultar Odoo en anexo técnico donde el cliente licencia.

### Para quién / no para quién (copy acordado)

**Sí — para vos si…**
- **PYME comercial** en Argentina: retail, pinturerías, ferreterías, distribución chica, rubros con mostrador o venta presencial  
- **Una sucursal** (o empezar por una), equipo chico (~5 personas)  
- Querés **caja + stock + compras** (y ampliaciones después) ordenados en un solo sistema ModoOps  
- Aceptás arrancar con **descubrimiento** (**$155 USD**) antes del proyecto  

**No — no es para vos si…**
- Necesitás **muchas sucursales** o B2B complejo desde día 1  
- Querés solo **integración** con otro sistema, sin montar la operación en Odoo  
- Buscás **desarrollo a medida ilimitado** sin alcance  
- No podés dedicar tiempo a **datos, fiscal con tu contador** e **infra** propia  

### Captación (CTA)

- **Formulario:** nombre, empresa, rubro, mensaje breve.  
- **Email:** [consultoria.matasini@gmail.com](mailto:consultoria.matasini@gmail.com)  
- **WhatsApp comercial:** **+54 9 354 753-2008** (número publicado: 3547532008) — consultas y pedido de descubrimiento; **no** canal de soporte ilimitado post contrato.

**Email de contacto comercial**:
Gmail de consultoría hasta tener dominio propio (`contacto@…`). Objetivo: migrar sin cambiar procesos de captación.

**WhatsApp comercial**:
Visible en landing/PDF para **Prospectos** y venta del **Descubrimiento pago**. Tras contrato, aplican reglas de **Soporte** (horario comercial, **Emergencia** solo si bloqueo operativo/fiscal atribuible al entregado).
_Avoid_: soporte 24/7 o cambios de alcance por WhatsApp sin cotizar; confundir WhatsApp comercial con **Hipercare** ilimitado.

**Lead**:
Ficha pública de un negocio captada para prospección (nombre, dirección, teléfono, web, categoría, rating, coordenadas, place_id/cid, fuente, fecha de captura, estado nuevo/contactado/descartado; email solo opcional sin extracción bulk por defecto). Vive en `modoops_master`, aislada de los Tenants; **purga automática 90 días** + supresión inmediata ante opt-out.
_Avoid_: guardar emails en bulk por defecto; mezclar leads con datos de un **Tenant**; persistir datos reales sin base jurídica validada.

**Captación propia**:
Prospección de ModoOps con **Leads** propios (ej. scraper GMaps slice-1 en modo borrador). Solo lectura/export por admin vía **Control Plane**, auditado; base jurídica con interés legítimo evaluado (LIA) + validación de asesor antes de datos reales.
_Avoid_: confundir con **Captación (CTA)** de prospectos entrantes; exponer leads a Tenants de **Clientes**.

### Hero (copy ModoOps — a validar)

- **Titular:** Tu operación, en modo.  
- **Subtítulo:** ModoOps — Sistema de Gestión Modular — Argentina, PYME, una sucursal.  
- **Firma:** ModoOps (Mauricio Matasini, arquitecto).  
- **Modelo landing:** hero amplio; **Odoo no se nombra** en Solución/Camino (marca blanca comercial). Anexo técnico sí lista Odoo CE 19.  
- **CTA:** Formulario + **consultoria.matasini@gmail.com** + WhatsApp **+54 9 354 753-2008**.

## Descubrimiento pago — entregables

### Informe de diagnóstico (obligatorio)

1. Resumen ejecutivo  
2. Contexto del negocio y objetivos  
3. Proceso actual (venta, compras, stock, fiscal)  
4. Ajuste al **ICP** y nivel de complejidad  
5. Gaps respecto del **Paquete ancla**  
6. Riesgos (fiscal, datos, infra, plazos, capacitación)  
7. Recomendación técnica (CE/EE, Odoo 17/18, apps)  
8. Anexos a cerrar antes de Fase 1 (fiscal, módulos, catálogo)  
9. Próximos pasos  

### Propuesta comercial (obligatorio)

Documento **separado** del informe. Secciones:

1. Alcance del **Paquete ancla** (Módulos ModoOps del Catálogo vía Configurador)  
2. **Exclusiones** explícitas  
3. **Precio y cobro:** **$800 USD** (50% / 25% / 25%) + **techo ~92 h** (vertical define combo)  
4. **Criterios de aceptación** Hito 1 y Hito 2  
5. **Plazo orientativo** (capacidad ModoOps: hasta 2 anclas paralelas, 15–18 h/semana c/u)  
6. **Add-ons** opcionales con precios  
7. **Supuestos del Cliente** (infra, fiscal, contador, datos)  
8. **Soporte** post go-live (hipercare, transición, abono $45 USD)  
9. **Validez** de la propuesta: **20 días** desde la fecha de emisión  
10. **Próximo paso** (firma + anticipo **$400 USD**, menos **Crédito por cierre del ancla** si aplica → **$322.5 USD** netos)

### Agenda — 3 jornadas (Descubrimiento pago)

| Día | Foco | Salida parcial |
|-----|------|----------------|
| **1** | Contexto, proceso actual, flujo mostrador / compras / stock | Notas + gaps preliminares |
| **2** | Fiscal (borrador anexo) con **Asesor fiscal del Cliente** si puede; datos/catálogo; infra | Borrador anexo fiscal + **Lista cerrada de módulos** |
| **3** | Cierre alcance, riesgos; redacción **Informe de diagnóstico** + **Propuesta comercial** | Entrega de **ambos documentos** (o **Salida anticipada** si no hay fit ICP) |

## Anexo fiscal (Argentina) — plantilla de lista cerrada

> Completar y validar con **asesor fiscal** antes de prometer en contrato. Esta sección es el lugar canónico del “**A**” acordado en *grill-with-docs*.

- **Flujo incluido:** venta minorista en mostrador (POS / flujo equivalente acordado).
- **Comprobantes incluidos:** **por definir en Descubrimiento pago** — el anexo fiscal firmado (tipos exactos + casos de uso) se cierra **antes de iniciar Fase 1**; el **Paquete ancla** no promete comprobantes por defecto.
- **Operaciones incluidas (devoluciones / notas de crédito):** **por definir en Descubrimiento pago**; **excluidas del Paquete ancla** salvo que figuren **explícitamente** en el anexo fiscal firmado (sin asumir “básicas” por defecto).
- **Exclusiones típicas (personalizar):** regímenes especiales no listados, percepciones/retenciones complejas, multi-moneda, exportaciones, escenarios B2B fuera del ancla, integraciones con autoridades o terceros fuera del anexo.

## Catálogo ModoOps — Catálogo canónico (inicial validado en Servigas)

> **Módulos ModoOps validados** que ModoOps domina y ofrece sin add-on de evaluación. En marketing se nombran como ModoOps; en anexo técnico se mapea a Odoo. Ir ampliando solo tras validar en proyecto real. Configurador interno consulta este catálogo.

> **SSOT (ADR 0009):** `modoops_catalogo/catalogo.json` es la única verdad — genera `modoops_catalogo/_generated_selection.py` (Selection Odoo), `web/src/lib/catalogo.generated.ts` (CatalogoKey + CATALOGO_KEYS) y `docs/catalogo-modoops-inicial.md`. `interface` de 6 métodos (`get/allKeys/validate/toSelection/pricing/horasFor`) es el único seam; `sync_catalogo --check` fail-closed en CI.

| Módulo ModoOps | Módulo Odoo / tercero | Versión | Notas |
|----------------|------------------------|---------|-------|
| **Mostrador** | `point_of_sale` + `pos_discount` | CE 19 | 2 cajas POS, 1 sucursal, descuento manual línea + general |
| **Depósito Inteligente** | `stock` | CE 19 | 1 almacén, ubicaciones Recepción/Depósito/Mostrador (Servigas) |
| **Compras** | `purchase` | CE 19 | Órdenes, recepciones |
| **Fiscal AR** | `l10n_ar` + EDI | CE 19 | Según anexo fiscal cerrado; requiere asesor fiscal |
| **Migración Excel** | scripts `datos/import` | — | Add-on $155 USD, hasta 500 prod, validación staging |
| **Puente Factura Web** | `servigas_integrations` | — | Manual, planilla puente |
| _próximos candidatos (validar)_ | CRM, B2B básico, integración ML/TiendaNube | — | Solo vía Descubrimiento + Add-on |

## Lista cerrada de módulos — plantilla (por proyecto)

> Completar en **Descubrimiento pago** o anexo técnico firmado antes de Fase 1. Incluir **nombre técnico**, **versión/rama** y **repo** para terceros. Terceros: solo desde el **Catálogo canónico** salvo **Add-on**.

- **Odoo CE (versión acordada):** 17 / 18
- Ver **Alcance funcional del ancla** (apps y exclusiones)
- **Localización Argentina:** _pendiente módulo exacto según versión_
- **Módulos de terceros (OCA/otros):** _ninguno por defecto; elegir solo desde catálogo canónico_
- **Criterio de aceptación (cierre fiscal):** **Aceptación fiscal en staging** — checklist de emisión (y NC/anulación solo si figuran en el anexo) en ambiente de pruebas/homologación acordado; producción no es el entorno de prueba fiscal.

## Flagged ambiguities (ModoOps)

- **Marca ModoOps** = *Sistema de Gestión Modular*; **stack** = Odoo CE 19 + Astro BFF, pero **Odoo no aparece en marketing/propuesta** (marca blanca comercial). Sí aparece en **anexo técnico/licencia** y en configurador interno.
- **WhatsApp** en landing es **comercial**; post contrato rigen reglas de **Soporte** / **Emergencia** (mismo número, distinto uso).
- “Integración” se usa a veces para “implementar ModoOps”; aquí **implementación núcleo** es **Fase 1** y **integración externa** es **Fase 2**.
- “ARCA / AFIP / fiscal” se acota al **Estándar fiscal del ancla** (anexo cerrado). **Comprobantes** y **devoluciones/NC** no se asumen hasta el cierre del anexo en **Descubrimiento pago**; las NC/devoluciones además quedan **fuera del ancla** salvo lista explícita en el anexo firmado. Fuera de ese anexo: **Add-on** o propuesta aparte.
- **Ventana de coordinación fiscal:** confirmado **2 semanas hábiles** por defecto tras hito de staging.
- La **Capacidad de entrega** ModoOps: **hasta 2 implementaciones activas** en paralelo vía red a demanda.
- Tras la **Transición a dedicación full time**, se revisan **Capacidad de entrega** y plazos del ancla.
- Propuestas y contratos usan **Moneda de cotización** **USD** por defecto; **ARS** es opcional a pedido del **Cliente** con tipo de cambio.
- **Revisión de honorarios:** precios USD estables; ARS con índice en anexo si aplica; **Paquete ancla** en curso sin reajuste; **Abono mensual** y ventas nuevas al renovar/contratar.
- **Meta de ingreso ModoOps:** **$600 USD/mes** primeros 6 meses, revisión trimestral al alza; no es precio de lista.
- **"Todo lo que ofrece Odoo"** = todo lo que está en el **Catálogo ModoOps** validado, no todo OCA. Catálogo crece solo con validación en proyecto real.
- **Composable:** el cliente elige módulos del Catálogo, pero el **Ancla** es combo base cerrado por vertical (híbrido), no suma Lego ilimitada sin techo.
- **Infra Fase 1 vs 2:** Fase 1 backups/S3, RTO 60min, sin VPS réplica; Fase 2 hot standby, RTO 2–5min. Failover solo cuando recurrente >$400/mes.
- **Control Plane Fase 1:** lista tenants, instalar/quitar Módulos Catálogo, suspender/reactivar, logs. No edita vistas ni factura automático (manual).
- **Grafo GitNexus** (`graph+fts+vector 384 dims`): requisito de paridad **congelado** para agentes IA; validar con `npx gitnexus analyze --force --embeddings` (no `--pdg` en MVP).
- **IA en producción:** `Agente` estricto herramental + `Herramienta` única vía + `Aduana BFF` obligatoria + `Falla cerrada` + `Techo IA` en `Orquestador` + `Memoria` en Tenant + código nuevo en `modoops.*`. Sin `Herramienta` no hay `write`.

## Precios — referencia acordada (ModoOps, USD)

| Concepto | Monto USD |
|----------|-------------|
| **Tarifa diaria interna** (6 h) | **$52** |
| **Descubrimiento pago** (3 días, fijo) | **$155** (+ **$52**/día extra); **50%** acreditable al anticipo si cierra ancla en 20 días → crédito $77.5 |
| **Paquete ancla** (Fase 1, fijo + techo ~92 h) | **$800** (50% / 25% / 25% → $400 / $200 / $200) |
| **Abono mensual** (4 h + best effort bugs) | **$45/mes** |
| **Tarifa hora adicional** (cambios / fuera de alcance) | **$10.5/h** |
| **Meta de ingreso ModoOps** | **$600/mes** (primeros 6 meses; revisión trimestral al alza) |
| **Público (web/PDF)** | Descubrimiento **$155**; ancla y abono **tras diagnóstico** |
| **Migración catálogo** (≤500 prod.) | **$155** |
| **B2B básico** | **$155** |
| **Add-ons** (resto) | SKU fijo / días × $52 / $10.5/h según tipo |

## Add-ons — catálogo (ModoOps, USD)

> Completar SKUs a medida que repitas entregas. Precios internos; en web suelen ir **tras diagnóstico** salvo que decidas publicar uno.

| Add-on | Modelo | Precio USD | Notas |
|--------|--------|------------|-------|
| **Migración catálogo** (+ stock inicial acordado) | SKU fijo | **$155** | Hasta **500** productos (variantes = 1 ítem c/u salvo acuerdo); plantillas; validación en staging; sin histórico largo |
| Migración histórica / compleja | días × $52 | cotizar | Solo tras descubrimiento |
| **B2B básico** (post Fase 1) | SKU fijo | **$155** | Cuentas corrientes, listas/condiciones básicas; alcance en propuesta |
| **Fiscal fuera del estándar** | días × $52 | cotizar tras descubrimiento | Tras **Estándar fiscal del ancla**; sin SKU fijo al inicio |
| **Fase 2 — integración** (c/u) | días × $52 | mín. **2 días** (**$104**) confirmado | Por sistema externo; complejidad en propuesta |
| **Desarrollo a medida** | **$10.5/h** o días × $52 | según estimación | Supera **Techo de ajustes técnicos** (8 h) del ancla |

> Supuesto de capacidad: **~17 h/semana** facturables. Un solo **Paquete ancla** en 2–3 meses + **Abono mensual** de 2–3 clientes suele ser necesario para acercarse a la meta.
