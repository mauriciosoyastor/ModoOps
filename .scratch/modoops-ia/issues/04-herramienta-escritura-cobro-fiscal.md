# 04: Herramienta escritura — cobro OT con caja + guardarraíl fiscal

**What to build:** Como Operativo, "cobrá OT 123 por $1500 efectivo" → Herramienta `ot.cobro` envuelve `mo.work.order action_collect_cash` + `mo.cash.session` abierta, valida `groups_id`, respeta `modoops.fiscal_enabled` y registra `mo.cash.movement` + `modoops.tenant.log`.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Sin caja abierta → error auditado 422
- [ ] Con caja abierta → crea `mo.cash.movement` y actualiza `amount_collected`
- [ ] `account.move` fiscal bloqueado si `modoops.fiscal_enabled=False`
- [ ] Permiso `account.group_account_manager` para "retiro del dueño" validado
