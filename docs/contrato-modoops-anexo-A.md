# ANEXO A – ALCANCE CERRADO MODOOPS + ACTA DE ACEPTACIÓN

> Template reutilizable por cliente. Va firmado con el contrato principal.
> Contrato base: Locación de Servicios – Implementación ModoOps + Abono Mantenimiento.
> Uso: copiar por cliente, completar `[]`, firmar. Propuesta válida 20 días.

---

## 0. Encabezado

Cliente: []
Fecha: []
Propuesta válida 20 días hasta: [___]
Versión Odoo CE acordada: [17 / 18 / 19 – tachar]
Tenant: modoops_[cliente]
Infra: [propia del cliente / central ModoOps Fase 1 – tachar]
Modalidad capacitación: [presencial / remota]

---

## A1. Módulos incluidos (lista cerrada, no "todo Odoo")

- Mostrador (POS) – hasta 2 cajas, 1 sucursal: [dirección sucursal]
- Depósito Inteligente (Stock) – 1 almacén: [nombre]
- Compras – proveedores + OC básicas
- Fiscal AR – según Anexo B (no se asume por defecto)
- Contabilidad operativa ligada a ventas/compras (no cierre mensual del estudio)
- Contactos – clientes/proveedores básicos
- Localización AR módulos exactos: [___]
- Terceros OCA: [ninguno / nombre + versión + repo]

## A2. Parámetros ICP incluidos

- Cajas: [1 / 2] – IDs: [___]
- Usuarios base: hasta 5 – perfiles: [ej. dueño, cajero, depósito]
- Lista precios venta: 1 + promos simples: [___]
- Catálogo: carga manual [muestra piloto ___ ítems] / Migración Add-on $155 hasta 500 ítems [SI/NO]
- Variantes: hasta 2 atributos: [ej. volumen + color – definir]
- Ajustes técnicos: 8h incluidas (vistas, campos simples, automatizaciones livianas, parametrización fina)
- Capacitación: 6h incluidas – fecha [___]
- Infra: [según encabezado]

Superadas las 8h de ajustes o pedido fuera de lista = Cambio/Add-on con presupuesto previo escrito.
Tarifa hora adicional $10.5 USD/h. Día $52 USD.

Referencias Add-on:
- Migración catálogo hasta 500 ítems $155 USD
- B2B básico $155 USD
- Integración desde $104 USD (mín. 2 días)

## A3. Excluido expreso (si lo pide = Add-on escrito)

CRM, web/eCommerce, MRP, multi-sucursal/almacén, B2B avanzado, integraciones externas (ML, balanza, etc.), migración histórica, fiscal fuera de estándar, percepciones/retenciones complejas, multi-moneda, exportaciones.

## A4. Hito 1 – Núcleo en staging (control interno)

Fecha objetivo: [___]

Checklist firma cliente:

- [ ] Apps instaladas CE versión acordada
- [ ] Catálogo piloto / migración validada
- [ ] Compra → recepción en 1 almacén OK
- [ ] Venta POS en cada caja descuenta stock OK
- [ ] Usuarios y permisos OK
- [ ] Contabilidad operativa en staging OK (sin fiscal real)

Plazo para observar: 5 días hábiles desde notificación. Silencio = aceptación (cláusula 3.4).

Firma: ______

## A5. Hito 2 – Go-live + hipercare – destraba 50% final

Fecha objetivo: [___]

- [ ] Go-live en ambiente cliente (una puesta incluida)
- [ ] Anexo B fiscal cerrado + prueba staging/homologación OK
- [ ] POS operativo cada caja producción
- [ ] Compras + inventario operativos
- [ ] Capacitación 6h dictada [fecha/horas] o plan remanente firmado [fecha]
- [ ] Checklist infra revisado (backup, SSL, accesos) – sin SLA
- [ ] Inicio hipercare 10 días hábiles desde [] hasta [] + comunicado mes transición y abono desde mes 2

Hipercare: solo bugs alta/media sin workaround respecto a alcance aceptado. No cubre mal uso, datos, infra, terceros, fiscal no incluido, Odoo upstream.

Firma cliente: ______ Firma prestador: ______

---

# ACTA DE ACEPTACIÓN Y COBRO FINAL – 1 carilla

En [], a los [], MODOOPS y [CLIENTE] dejan constancia:

1. Hito 2 cumplido según checklist A5 arriba. Detalle fallas menores pendientes (si no hay, poner "ninguna"): [___]
2. Con esta firma EL CLIENTE acepta el sistema en producción e inicia hipercare hasta [fecha 10 días hábiles].
3. Se habilita facturación del 50% saldo final: [$___ USD – ARS equiv. TC ], a cuenta Alias iluso.pared.reasume / CBU 3220001888034741040018, contra Factura C N° [].
4. Desde [mes siguiente] rige mes transición, desde [mes+2] abono mensual $___ con vencimiento 1 al 10, suspensión a 7 días de notificada mora según cláusula 9.
5. Pendientes fuera de alcance detectados: [___] se presupuestan como Cambio/Add-on, no frenan pago.
6. Si el cliente no firma ni observa en 5 días hábiles, vale como aceptado por cláusula 3.4.

Cliente (firma, aclaración, DNI): ___________
Prestador Mauricio Matasini (firma): ___________

---

## Tip para cobrar sin pelea

Mandalo por WhatsApp + email el día del go-live, pedí foto firmada o firma digital. Sin esta acta el 50% se demora. Dejá por escrito en el mensaje: "Si no hay observaciones en 5 días hábiles se considera aceptado según cláusula 3.4".
