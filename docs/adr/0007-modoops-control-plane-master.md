# ADR 0007 — Control Plane ModoOps (`modoops_admin` en base `modoops_master`)

Creamos Control Plane como módulo Odoo `modoops_admin` en base `modoops_master` (mismo VPS/Postgres central Multi-DB) para gestionar N tenants `modoops_<cliente>`: lista, instalar/quitar Módulos ModoOps del Catálogo, logs, suspender por mora con gracia 7 días. MVP sin editor de vistas ni billing auto.

## Considered Options

- **Standalone Astro/Next.js** (admin.modoops.com) vs **Módulo Odoo en base master**. Elegimos Odoo master por reutilizar stack ModoOps (Liquid Glass/Astro) y salir en 1–2 semanas.
- **Scope B (editor runtime)** y **C (billing auto)** descartados para MVP: 4–6 semanas y riesgo de romper tenants.
- **Suspensión automática día 1** vs **gracia 7 días + aviso**. Elegimos gracia para no cortar comercios por $45 un sábado.

## Consequences

- Se añade base `modoops_master` al Postgres central (1 DB más). Control Plane no toca datos de tenants, solo orquesta `odoo-bin -d <tenant> -i/u`.
- Próximo paso: spec `modoops_admin` v0.1 + mock panel.
