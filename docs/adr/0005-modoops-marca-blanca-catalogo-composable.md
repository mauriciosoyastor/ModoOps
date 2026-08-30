# ADR 0005 — ModoOps: marca blanca comercial, Catálogo ModoOps y modelo composable

ModoOps evoluciona la consultoría Odoo a marca blanca comercial: en marketing/propuesta no se menciona Odoo (se vende "ModoOps — Sistema de Gestión Modular"), en anexo técnico/licencia se explicita Odoo CE 19 + Módulos ModoOps. El universo ofrecible es el Catálogo ModoOps (módulos validados en proyectos reales, no todo OCA), con herramienta interna Configurador para armar Anclas por combo (híbrido: ancla fija + add-ons a la carta) y meta $600 USD/mes con hasta 2 anclas en paralelo vía red a demanda.

## Considered Options

- **Marca:** A) blanca total (ocultar Odoo incluso en contrato, fork total) vs B) blanca comercial (ocultar en marketing, explicitar en anexo técnico). Elegimos B por transparencia/legalidad y porque Astro BFF ya oculta OWL en uso diario sin necesidad de fork.
- **Catálogo:** A) "todo Odoo/OCA desde día 1" vs B) "todo el Catálogo ModoOps validado". Elegimos B para no prometer MRP/RRHH sin expertise ni romper techo 92h; catálogo crece solo con validación en proyecto real (Servigas = Caso Retail inicial).
- **Modelo venta:** A) Lego puro (suma de módulos sin combo) vs B) combos cerrados vs C) híbrido. Elegimos C: Ancla = combo base por vertical (precio fijo $800 USD) + Add-ons SKU/días. Hereda ancla retail validado y evita techo infinito.

## Consequences

- Se evoluciona `CONTEXT.md` a ModoOps, con glosario Módulo/Catálogo/Ancla/Composable y migración ARS→USD. Próximo hito es extraer Catálogo inicial de Servigas (Mostrador, Depósito Inteligente, etc.) antes del siguiente Descubrimiento pago ModoOps.
