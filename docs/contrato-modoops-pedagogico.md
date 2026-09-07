# Contrato ModoOps — Versión pedagógica (espejo didáctico)

> **Vale lo firmado.** Esta es una guía en lenguaje simple del `docs/contrato-modoops-completo.html` + `docs/contrato-modoops-anexo-A.md`.
> Si hay diferencia, manda el contrato firmado. Cifras congeladas del original.

## Cómo leer este documento

Cada sección tiene: **qué dice el contrato** (resumen fiel) + **en criollo** (explicación simple) + **qué tenés que hacer** (tu parte).

---

## 1. Objeto — qué te llevás

**Dice:** Implementación ModoOps sobre Odoo CE + go-live + hipercare + capacitación + abono posterior. Relación entre independientes, sin dependencia laboral.

> En criollo: te instalamos tu sistema de gestión andando, te enseñamos a usarlo, te acompañamos 10 días hábiles y después seguimos con abono si querés.

**Hacé:** entender que comprás un alcance cerrado, no "todo Odoo".

## 2. Definiciones — hablamos el mismo idioma

- **Descubrimiento ($155):** diagnóstico pago de 3 días, separado del ancla.
- **Paquete ancla ($800 ref):** implementación precio fijo por lista cerrada.
- **Hito:** firma que destraba un pago. Sin firma no hay pago.
- **Go-live:** prender el sistema en tu local (una puesta incluida).
- **Hipercare (10 días hábiles):** solo arreglamos bugs del alcance, gratis.
- **Bug vs Cambio:** bug = no anda lo prometido; cambio = pedís algo nuevo, se cotiza.
- **Ajuste (8h) / Capacitación (6h):** bolsas incluidas, con tope.

> En criollo: si estaba en la lista y no anda, lo arreglamos. Si no estaba, te pasamos precio antes.

## 3. Alcance — Anexo A manda

**Dice:** lista cerrada: Mostrador hasta 2 cajas 1 sucursal, Depósito 1 almacén, Compras, Fiscal AR según Anexo B, contabilidad operativa, contactos, 5 usuarios, 1 lista de precios, 2 atributos de variante, 8h ajustes, 6h capacitación. Precio fijo por alcance, no horas ilimitadas. Silencio 5 días hábiles = aceptado.

> En criollo: lo que está en la lista entra. Lo que no, es add-on con precio escrito.

**Hacé:** revisar A1-A5 y tachar lo que corresponda antes de firmar.

## 4. Fiscal — Anexo B

**Dice:** sin Anexo B firmado por tu contador + prueba en staging, no hay go-live ni factura real. Certificados y puntos de venta de prueba los ponés vos. 2 semanas hábiles de coordinación incluidas, después $10.5 USD/h o $52 USD/día.

> En criollo: lo fiscal lo define tu contador, no nosotros. Sin su OK no salimos a facturar.

## 5. Precio 50/50 — cómo se paga el ancla

**Dice:** total fijo `[___ USD — ref $800]`, propuesta válida 20 días. 50% anticipo para reservar fecha e iniciar; 50% saldo contra go-live + acta Hito 2. USD por defecto; ARS solo si pedís, con TC definido. Cuenta: Alias **iluso.pared.reasume**, CBU **3220001888034741040018**, Factura C. Si venís de Descubrimiento y firmás en 20 días, se acreditan **$77.5 USD** al anticipo. Mora automática + interés.

> En criollo: mitad para arrancar, mitad al final cuando firmás que anda. Sin anticipo no corre el plazo.

## 6. Tu parte — obligaciones

Accesos, internet, PCs/cajas, datos en plantilla, tiempo para capacitarte y tu contador a tiempo. Si no entregás, la fecha se corre sin penalidad para nosotros.

## 7. Cambios y add-ons

Hora extra **$10.5 USD/h**, día **$52 USD**. Refs: migración catálogo 500 ítems **$155**, B2B básico **$155**, integración desde **$104** (mín 2 días). Todo con tu OK escrito previo.

> En criollo: nada se hace "de palabra". Pedís, cotizamos, aceptás por escrito, recién ahí se hace.

## 8. Garantía — hipercare

10 días hábiles post go-live: solo bugs alta/media sin workaround del alcance. No cubre mal uso, datos, tu infra, terceros, fiscal no incluido ni Odoo de base. Después, solo con abono.

## 9. Abono — del 1 al 10, con 7 días de gracia

Mes 1 post-hipercare: transición best effort. Desde mes 2: **$45 USD/mes ref**, 4h + best effort bugs, horas que vencen. Pagás del **1 al 10**. Vencido: mora + aviso WhatsApp/email. A los **7 días** sin pago se suspende (solo lectura, sin borrado, IA bloqueada); se rehabilita en 24/48h hábiles. A los **15 días** suspendido: backup final y baja; re-alta con cargo.

> En criollo: pagá del 1 al 10 y todo sigue. Si te atrasás 7 días se pausa. A los 15 se da de baja con backup.

## 10. Propiedad intelectual

ModoOps y desarrollos siguen siendo nuestros salvo cesión escrita con pago total. Vos tenés licencia intransferible en tu tenant `modoops_[cliente]` mientras estés al día. Odoo CE es GPL/LGPL de terceros.

## 11. Confidencialidad y datos

3 años de confidencialidad. Tus datos son tuyos, no se venden. Memoria IA en tu tenant, 90 días.

## 12. Infra y tope

Sin SLA salvo anexo. Si la infra es tuya: diagnosticamos y coordinamos. Si es central Fase 1: backup nightly, RPO 24h / RTO 60min. Tope: lo pagado del ancla. Sin lucro cesante.

## 13. Plazo y rescisión

Plazo `[___ semanas desde anticipo + accesos]`. Rescisión con 15 días. Si rescindís sin causa: pagás avance + hitos, anticipo ejecutado no vuelve. Abono: avisando antes del 20. Incumplimiento grave: intimación 10 días.

## 14. Jurisdicción

Tribunales de Alta Gracia, Córdoba. Domicilios y emails del encabezado valen como notificación.

## 15. Anexos

A Alcance + checklists, B Fiscal, C Precio y actas. Firmar los tres.

---

## Anexo A pedagógico — tu checklist

- A1 módulos: 2 cajas, 1 sucursal, 1 almacén, 5 usuarios, 1 lista, 2 atributos.
- A2: catálogo piloto o migración $155; ajustes 8h; capacitación 6h.
- A3 excluido: CRM, web, MRP, multi-sucursal, B2B avanzado, integraciones, histórico, multi-moneda.
- A4 Hito 1 staging: 6 casilleros + 5 días para observar.
- A5 Hito 2 go-live: 7 casilleros + hipercare 10 días hábiles. Destraba el 50% final.

## Acta Hito 2 — 1 carilla (resumen simple)

Firmando decís: anda según A5, arranca hipercare hasta fecha, se puede facturar el saldo a la cuenta de siempre contra Factura C, desde el mes que viene transición y al otro abono, lo nuevo se cotiza aparte, y si no observás en 5 días vale como aceptado.
