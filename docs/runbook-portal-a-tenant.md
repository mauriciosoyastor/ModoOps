# Runbook — del borrador del portal al Tenant (uso del consultor)

> Ticket 04. El portal jamás crea Tenants solo: toda base nace de validación
> humana con contrato. Este procedimiento corre en la máquina del consultor
> (o staging) con Python 3.12+, sin Odoo hasta el paso 5.

## 0. Recibir el borrador

El Prospecto lo envía por WhatsApp o copiar-JSON desde `/oficina` (paso 3).
Guardar el texto en `borrador.json` y validar forma mínima:

```bash
python -c "import json; b=json.load(open('borrador.json')); assert b['version']=='borrador-v1' and b['vinculante'] is False; print('OK', b['prospecto']['nombre'])"
```

## 1. Traducir (ticket 02)

```bash
python -c "
import sys, json
sys.path.insert(0, 'tools/configurador/logic')
from borrador_bridge import traducir_borrador
b = json.load(open('borrador.json'))
json.dump(traducir_borrador(b), open('input_configurador.json','w'), indent=1, ensure_ascii=False)
print(open('input_configurador.json').read())"
```

Reglas que aplica el puente: rubro→vertical, mostrador→cajas, estantería→almacenes,
góndola→listas, productos→SKU, ancla+futuros→tildados, **`anexo_fiscal_ref: null`
siempre** (el portal nunca trae anexo firmado por diseño).

## 2. Generar (esperar el hard gate fiscal)

```bash
python -c "
import sys, json
sys.path.insert(0, 'tools/configurador/logic')
import configurador
out = configurador.generar(json.load(open('input_configurador.json')))
print('ERRORS:', out['errors']); print('WARNINGS:', out['warnings'])"
```

**Esperado sin anexo:** `ERRORS: ['Falta anexo_fiscal_ref para Fiscal AR (hard gate)']`.
Eso no es un error del borrador: es el diseño. Si el Prospecto no tildó nada
fiscal, este paso ya sale limpio y se salta al paso 4.

## 3. Cerrar el anexo fiscal en el Descubrimiento

Con el Asesor fiscal del Cliente: tipos de comprobante, NC/devoluciones,
responsable. Registrar la referencia (p. ej. `AF-2026-014`) e inyectarla:

```bash
python -c "
import sys, json
sys.path.insert(0, 'tools/configurador/logic')
import configurador
inp = json.load(open('input_configurador.json')); inp['anexo_fiscal_ref'] = 'AF-2026-014'
out = configurador.generar(inp)
json.dump(out, open('salida_configurador.json','w'), indent=1, ensure_ascii=False)
print('errors:', out['errors']); print('warnings:', out['warnings']); print('hash:', out['hash'])"
```

## 4. Emitir Lista cerrada + propuesta + anexo técnico

De `salida_configurador.json`:
- `lista_cerrada` → va al contrato (nombres ModoOps, marca blanca).
- `propuesta.comercial_md` → Propuesta comercial (validez 20 días, anticipo neto).
- `anexo_tecnico.mapeo` → módulos Odoo a instalar.
- `precio` → ancla, anticipo, addons.

Ejemplo real verificado (Pinturería Centro, 6 ancla + Migración Excel, hash `ec01e321c4b0`):
lista `mostrador, deposito, ventas, compras, fiscal_ar, contactos, migracion_excel`;
precio ancla $800, anticipo neto $322.5, addons `[migracion_excel]`;
warning: `Total horas 105 supera techo 92h → oferta Fase 2 días×52`.

## 5. Aprovisionar el Tenant (staging — pendiente Docker en esta sesión)

Derivar los módulos del anexo técnico (únicos, ordenados):

```bash
python -c "
import json
out = json.load(open('salida_configurador.json'))
mods = sorted({m for v in out['anexo_tecnico']['mapeo'].values() for m in v['odoo']})
print(','.join(mods))"
```

Con el ejemplo: `account,contacts,l10n_ar,point_of_sale,pos_discount,purchase,sale_management,stock`.
Slug en minúsculas con guiones bajos (Postgres no acepta guiones en `createdb` sin comillas):

```bash
createdb -T template0 modoops_pintureria_centro
odoo-bin -d modoops_pintureria_centro -i account,contacts,l10n_ar,point_of_sale,pos_discount,purchase,sale_management,stock --stop-after-init
python tools/modoops_provision/provision_tenant.py --slug pintureria_centro --name "Pinturería Centro" --vertical retail
python tools/modoops_provision/provision_tenant.py --list
```

Detalle de backup/RPO y registro en `modoops_master`: `tools/modoops_provision/README.md`.
**Pendiente:** ejecutar este paso en staging con Docker (sin Docker en la sesión
que escribió este runbook — no dar por verificado hasta correrlo ahí).

## Qué falla en cerrado y qué decide el consultor

| Síntoma | Causa | Decisión |
|---|---|---|
| `Falta anexo_fiscal_ref para Fiscal AR` | Sin anexo firmado | Cerrar anexo en Descubrimiento (paso 3), nunca saltearlo |
| `Módulo 'X' no existe en catálogo` | Borrador manipulado o catálogo viejo | Rechazar el módulo o actualizar SSOT vía `sync_catalogo.py` |
| `SKU N supera tope 500` | Catálogo grande | Tramo extra días×$52 (Migración Excel) |
| `Total horas N supera techo 92h` | Ancla + futuros pesados | Recortar módulos o derivar a Fase 2 días×$52 |
| `vinculante != false` o `version` distinta | JSON no-portal | No procesar: pedir reenvío desde `/oficina` |
