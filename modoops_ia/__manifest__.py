{
    "name": "ModoOps IA — Agente herramental",
    "summary": "Agente ModoOps, Herramientas auditadas y Memoria Tenant (Orquestador BFF)",
    "description": """
ModoOps IA (modoops_ia): Agente herramental único, Catálogo de Herramientas en modoops_master,
Ejecución + Memoria en Tenant con Contexto Tenant, Orquestador BFF Astro como aduana,
Falla cerrada, Techo IA y namespace modoops.* separado de mo.* legacy.
Ver ADR 0008 y CONTEXT.md Agentes IA.
    """,
    "author": "ModoOps",
    "website": "https://modoops.com",
    "category": "ModoOps",
    "version": "19.0.1.0.1",
    "license": "LGPL-3",
    "depends": ["base", "mail", "modoops_admin"],
    "data": [
        "security/ir.model.access.csv",
        "data/modoops_agent_tool_data.xml",
    ],
    "assets": {},
    "installable": True,
    "application": False,
}
