/** @odoo-module **/

import { registry } from "@web/core/registry";
import { resolveLauncherTileAction } from "./mo_pos_entry";

const QUICK_NAV_TAGS = {
    inventory: "modoops_inventory_hub",
    sales: "modoops_sales_hub",
    purchase: "modoops_purchase_hub",
    accounting: "modoops_accounting_hub",
    workshop: "modoops_workshop_hub",
    pos: "__pos__",
};

export const sgLauncherService = {
    dependencies: ["orm", "action"],
    start(_env, { orm, action }) {
        let tilesCache = null;

        return {
            async loadLauncher() {
                const payload = await orm.call("mo.app.tile", "get_launcher_payload", []);
                tilesCache = payload.tiles || [];
                return payload;
            },
            openTile(tile) {
                const nextAction = resolveLauncherTileAction(tile);
                if (nextAction) {
                    return action.doAction(nextAction);
                }
                return Promise.resolve();
            },
            goHome() {
                return action.doAction("modoops_core.action_modoops_app_launcher");
            },
            async openQuickNav(key) {
                if (!tilesCache) {
                    await this.loadLauncher();
                }
                if (key === "home") {
                    return this.goHome();
                }
                const tag = QUICK_NAV_TAGS[key];
                if (!tag) {
                    return Promise.resolve();
                }
                const tile = tilesCache.find((t) => {
                    if (tag === QUICK_NAV_TAGS.pos) {
                        return (
                            t.label === "Mostrador" ||
                            t.label === "Punto de venta"
                        );
                    }
                    return t.client_tag === tag;
                });
                if (tile) {
                    return this.openTile(tile);
                }
                return Promise.resolve();
            },
        };
    },
};

registry.category("services").add("mo_launcher", sgLauncherService);
