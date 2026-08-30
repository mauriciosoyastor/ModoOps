# ADR 0008 — Agente herramental único, catálogo central y BFF Astro como aduana obligatoria

Agente = operador herramental tenant-aislado (chat = UI del mismo agente), no dos tipos de agente. Herramienta = única vía de escritura, wrapper con contrato cerrado (`input_schema` + `groups_id` + auditoría), distinta de Add-on/Integración/ir.actions; lógica pura en `modoops_ia/logic/` sin ORM + wrapper Odoo auditado. Catálogo de Herramientas vive en `modoops_master` para control comercial; la ejecución y la Memoria viven siempre en `modoops_<slug>` con `Contexto Tenant` (`db_name` inyectado) — credenciales externas se leen del Tenant, nunca del master. Toda invocación pasa por el Orquestador BFF Astro (`POST /api/modoops/<db>/agent/run`, valida `api_key` por Tenant, rate-limit, enforza `Techo IA` y `Suspensión por mora`, audita en `modoops.tenant.log`) y nunca directo a Odoo con `auth='public'` o cookie.

Falla cerrada: sin Herramienta no hay `write`; el Agente genera borrador/CSV revisable o deriva a humano (`mail.activity`), con upselling a **Cambio** (`$10.5/h`) o **Add-on** si hay valor — nunca improvisa `env[model].write`.

Alternativas rechazadas: a) chatbot vs agente separados (duplica código y permite escrituras no auditadas), b) definición + ejecución todo en tenant (duplica catálogo, pierde control de suscripción), c) agente multi-tenant (rompe aislamiento Multi-DB), d) Odoo directo sin BFF (escalada a `group_system`, sin bloqueo por mora centralizado), e) memoria central en master (fuga PII cross-tenant), f) IA ilimitada en Abono $45 (costo LLM sin techo).

Nuevo módulo `modoops_ia` con namespace `modoops.*` separado de legacy `mo.*`.

