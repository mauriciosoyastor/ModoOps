/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { SgLauncherShell } from "./mo_launcher_shell";
import { SgLauncherTile } from "./mo_launcher_tile";

export class AppLauncher extends Component {
    static template = "modoops_core.AppLauncher";
    static path = "modoops_app_launcher";
    static components = { SgLauncherShell, SgLauncherTile };
    static props = ["*"];

    setup() {
        this.launcherService = useService("mo_launcher");
        this.state = useState({
            tiles: [],
            loading: true,
        });
        onWillStart(async () => {
            await this.loadLauncher();
        });
    }

    get shellProps() {
        return {
            showTitle: false,
            showSubtitle: false,
            showHome: false,
            showBack: false,
            isRootMenu: true,
        };
    }

    async loadLauncher() {
        this.state.loading = true;
        const payload = await this.launcherService.loadLauncher();
        this.state.tiles = payload.tiles || [];
        this.state.loading = false;
    }

    onTileClick(tile) {
        return this.launcherService.openTile(tile);
    }
}

registry.category("actions").add("modoops_app_launcher", AppLauncher);
