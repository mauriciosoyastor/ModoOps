def migrate(cr, version):
    """Día D: home OWL solo Settings; quitar launcher de operativos."""
    from odoo import SUPERUSER_ID, api

    env = api.Environment(cr, SUPERUSER_ID, {})
    env["mo.app.tile"].setup_launcher_home_for_users()
    menu = env.ref("modoops_core.menu_modoops_root", raise_if_not_found=False)
    group = env.ref("base.group_system", raise_if_not_found=False)
    if menu and group:
        menu.write({"group_ids": [(6, 0, [group.id])]})
