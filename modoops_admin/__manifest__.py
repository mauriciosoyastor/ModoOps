{
    "name": "ModoOps Admin — Control Plane",
    "summary": "Panel interno para gestionar Tenants Multi-DB (instalar módulos, suspender por mora)",
    "description": """
Control Plane ModoOps en base modoops_master.
Lista de Tenants (modoops_<cliente>), instalar/quitar Módulos ModoOps del Catálogo, logs, suspender/reactivar con gracia 7 días.
Mock v0.1 — sin billing auto ni editor runtime.
    """,
    "author": "ModoOps",
    "website": "https://modoops.com",
    "category": "ModoOps",
    "version": "19.0.1.0.1",
    "license": "LGPL-3",
    "depends": ["base", "web", "mail"],
    "data": [
        "security/ir.model.access.csv",
        "security/modoops_tenant_log_access.xml",
        "views/modoops_tenant_views.xml",
        "views/modoops_tenant_contrato_views.xml",
        "views/modoops_tenant_install_wizard_views.xml",
        "views/modoops_configurador_wizard_views.xml",
        "views/modoops_tenant_log_views.xml",
        "report/modoops_reports.xml",
        "views/modoops_admin_menus.xml",
        "data/modoops_tenant_demo.xml",
        "data/modoops_tenant_cron.xml",
        "data/modoops_lead_cron.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "modoops_admin/static/src/scss/modoops_admin.scss",
        ],
    },
    "installable": True,
    "application": True,
}
