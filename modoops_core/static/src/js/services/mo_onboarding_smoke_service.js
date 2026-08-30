/** @odoo-module **/

import { registry } from "@web/core/registry";
import { session } from "@web/session";
import { mountOnboardingSmokeOverlay } from "./mo_onboarding_smoke_boot";

export const sgOnboardingSmokeService = {
    start() {
        return mountOnboardingSmokeOverlay({
            track: "app",
            devAssets: Boolean(session.mo_dev_assets),
        });
    },
};

registry.category("services").add("mo_onboarding_smoke", sgOnboardingSmokeService);
