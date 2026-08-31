# Anexo Fiscal — ModoOps (Argentina)

> Bloquea go-live, no staging. Requiere firma Cliente + validación Asesor fiscal del Cliente + Aceptación fiscal en staging. Ver CONTEXT.md: Cierre del anexo fiscal.

## Flujo incluido
venta minorista en mostrador (POS)

## Comprobantes incluidos
- [ ] Factura B
- [ ] Factura A
- [ ] Nota de Crédito (solo si lista explícita)
- [ ] Anulación

> Cada tipo listado debe emitirse y anularse/nota en staging/homologación. Producción no es laboratorio.

## Operaciones incluidas
- Devoluciones / NC: por definir, excluidas salvo lista explícita

## Exclusiones
regímenes especiales no listados, percepciones/retenciones complejas, multi-moneda, exportaciones, B2B fuera del ancla

## Entorno fiscal de prueba
Homologación / credenciales / punto de venta de prueba provistos por Cliente o Asesor fiscal. Consultor configura Odoo contra ese entorno.

## Validación
- Asesor fiscal: __________________ Firma: __________ Fecha: _______
- Cliente: _______________________ Firma: __________ Fecha: _______

## Checklist Aceptación fiscal en staging
- [ ] Emitir cada comprobante listado en homologación
- [ ] Anular / NC solo si figura en anexo
- [ ] Sin uso de producción como laboratorio
