# Memo LIA — captación propia con leads GMaps (S4 #98)

> No es asesoramiento legal. Base a validar con asesor antes de persistir
> datos reales. Estado validación asesor: **pendiente**.

## Finalidad

Prospección comercial propia de ModoOps: identificar negocios (PYME retail
Argentina) para ofrecer el Descubrimiento pago. Solo fichas públicas de
Google Maps (nombre, dirección, teléfono, web, categoría, rating,
coordenadas). Sin emails bulk (flag `-email` prohibido en operativa).

## Necesidad

Sin estos datos no hay a quién contactar; no existe medio menos invasivo
para prospección B2B inicial que el dato de contacto público del negocio.

## Balance (interés legítimo vs derechos)

- Datos de contacto profesional publicados por el propio negocio.
- Contacto B2B pertinente (oferta de gestión, no consumo masivo).
- Minimización: purga 90 días + opt-out inmediato + tabla aislada en
  `modoops_master` (nunca en Tenants de clientes) + acceso solo admin auditado.
- Riesgo residual: ToS Google Maps §3.2.3 (asumido, #89) + RGPD/LOPDGDD
  (teléfonos/emails son datos personales).

## Garantías implementadas

- `estado=descartado` automático sin teléfono (regla #98, sin canal no hay contacto).
- Cron purga 90d + `action_opt_out` con borrado físico y log sin PII (S1).
- Prohibido persistir datos reales hasta validación del asesor (bloqueo vigente).
