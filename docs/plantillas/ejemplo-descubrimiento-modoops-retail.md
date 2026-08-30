# Ejemplo — Descubrimiento ModoOps Retail (ficticio)

> Prospecto: **Pinturerías Centro** (Córdoba) — 1 sucursal, 4 empleados mostrador + dueña. Objetivo: ordenar stock/caja/compras antes de verano. Descubrimiento 2026-09-02 al 04 ($155 USD).

## 0. Datos Prospecto

- Empresa / CUIT: Pinturerías Centro SRL / 30-71234567-8
- Rubro / vertical: Retail pinturería (mostrador + obra)
- Contacto / rol: Laura Gómez (dueña, decide) + contador Estudio López
- Fecha inicio (Día 1): 2026-09-02
- Asesor fiscal: Cr. López (lopez@estudio.com) — valida anexo

## 1. Día 1 — Proceso actual (relevado)

- [x] Flujo mostrador/POS: 1 mostrador con 2 PCs (caja A y B), 1 sucursal centro, venta 90% mostrador, 10% WhatsApp sin sistema. Objetivo: **Mostrador** 2 cajas POS.
- [x] Stock: Excel desactualizado (~1.200 SKU activos), 1 depósito chico sin ubicaciones, faltantes frecuentes. Dolor #1.
- [x] Compras: 3 proveedores (Alba, Petrilac, Tersuave), pedidos por WhatsApp, sin OC en sistema.
- [x] Ventas: solo mostrador, descuentos a mano según cliente (obra vs particular). Necesita **Descuento manual POS**.
- [x] Dolor principal: stock no coincide, compras sin control, caja cierra a mano en cuaderno.
- Notas / gaps: No hay B2B ni eCommerce; no pide MRP. Encaja ICP (1 sucursal, 4 usuarios + dueña = 5).

## 2. Día 2 — Fiscal / Datos / Infra

### Fiscal — borrador anexo (pendiente firma López)
- [x] Régimen: Responsable Inscripto, Factura A/B/C
- [x] Comprobantes incluidos (lista cerrada): **FC A/B/C + NC por devolución simple** (incluida en anexo, validada en staging)
- [x] NC / devoluciones: incluidas (solo devolución completa, no parcial compleja)
- [x] Entorno fiscal prueba: Cliente provee homologación ARCA + punto venta prueba (trámite Estudio López)
- [x] Exclusiones: percepciones especiales, exportación, multi-moneda → fuera ancla, Add-on si hace falta

### Datos / Catálogo
- [x] Catálogo actual: Excel `lista_pintureria_centro_2026.xlsx` (1.180 filas, códigos sucios)
- [x] Cantidad SKU: 1.180 → **Migración Excel no entra en 500** → cotizar Add-on Migración $155 (primeros 500) + tramo extra $52/día (680 restantes ≈ 1.5 días → $78). Propuesta: **Add-on Migración $233** (o cliente depura a 500).
- [x] Stock inicial: conteo parcial 120 prod, resto en 0 hasta conteo físico post go-live

### Infra
- [x] Hosting: VPS local provisto por cliente (Ubuntu, backups a cargo cliente, SSL)
- [x] Usuarios: 5 (Laura + 3 vendedores + contador lectura) — ~5 ICP ok
- [x] Accesos staging/producción: credenciales Odoo dev + prod acordadas

### Módulos — tildar Catálogo ModoOps (output Configurador)
- [x] Mostrador (POS 2 cajas) — Ancla
- [x] Depósito Inteligente (1 almacén) — Ancla
- [x] Ventas — Ancla
- [x] Compras — Ancla
- [x] Fiscal AR — Ancla
- [x] Plataforma ModoOps — siempre
- [x] Puente Factura Web — Ancla manual
- [ ] Taller — Add-on (no necesita)
- [ ] B2B Básico — Add-on (no)
- [ ] Otro: **Migración Excel ampliada** — Add-on $233 (ver arriba)

## 3. Día 3 — Cierre alcance, riesgos, entregables

- [x] Ajuste ICP: **Sí encaja** (1 sucursal, baja complejidad)
- [x] Gaps vs Ancla Retail: solo migración excede 500 → Add-on. Nada más fuera.
- [x] Riesgos: fiscal (espera homologación 1 semana), datos sucios (requiere depuración), infraestructura cliente (backups), capacitación mostrador
- [x] Recomendación técnica: CE 19, Ancla Retail + Migración Add-on, go-live en VPS cliente
- [x] Capacidad ModoOps: 1 ancla activa — entra (queda cupo 1 más)

### Entregables (generados vía Configurador)

- [x] Informe de diagnóstico (9 secciones) — entregado 2026-09-04
- [x] Propuesta comercial (10 secciones): **Ancla $800 (50/25/25) + Migración $233 + Abono $45/mes**, techo 92h + 12h migración, validez 20 días (hasta 2026-09-24), plazo 6–8 semanas (15–18h/sem)
- [x] Lista cerrada:
  - ModoOps Core 19.0.1.0.1 — Plataforma
  - Mostrador — point_of_sale + pos_discount — CE 19 — 2 cajas
  - Depósito Inteligente — stock — CE 19 — 1 almacén
  - Ventas — sale_management
  - Compras — purchase
  - Fiscal AR — account + l10n_ar — CE 19 — FC A/B/C + NC simple
  - Puente Factura Web — modoops_integrations — manual
  - Migración — scripts import — Add-on
- [x] Anexo fiscal borrador — pendiente firma López + validación staging antes go-live

## 4. Salida anticipada

No aplica (encaja ICP).

## 5. Próximo paso

- [x] Firma 2026-09-10 + anticipo **$400** menos crédito Descubrimiento $77.5 → **$322.5 netos**
- [x] Hito 1 staging: 2026-10-01 ($200) / Hito 2 go-live: 2026-10-28 ($200) + hipercare 10 días + abono $45 desde mes 2

---
*Ejemplo ficticio para validar plantilla — no es cliente real. Generado con Configurador ModoOps.*
