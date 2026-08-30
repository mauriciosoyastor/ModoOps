/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { useService, useBus } from "@web/core/utils/hooks";
import { SgLauncherShell } from "../launcher/mo_launcher_shell";
import { SgHubSectionBody } from "./mo_hub_section_body";

const DEFAULT_SECTION = "summary";

export class SgAppHub extends Component {
    static template = "modoops_core.SgAppHub";
    static components = { SgLauncherShell, SgHubSectionBody };
    static props = ["*"];

    setup() {
        this.hubService = useService("mo_hub");
        const app = this.constructor.app;
        const storedSection = this.hubService.getStoredSection(app);
        this.state = useState({
            sections: [],
            cards: [],
            groups: [],
            activeSection: storedSection || DEFAULT_SECTION,
            loading: true,
        });

        useBus(this.env.bus, "mo_HUB:SECTION_SELECT", ({ detail }) => {
            if (detail?.app === this.app) {
                this.loadHubData(detail.section);
            }
        });

        onWillStart(async () => {
            await this.loadHubData(this.state.activeSection);
        });
    }

    get app() {
        return this.constructor.app;
    }

    async loadHubData(section) {
        this.state.loading = true;
        try {
            const payload = await this.hubService.loadHub(this.app, section);
            const sections = payload.sections || [];
            const validCodes = new Set(sections.map((s) => s.code));
            let activeSection = payload.section || section;
            if (validCodes.size && !validCodes.has(activeSection)) {
                activeSection = DEFAULT_SECTION;
                if (activeSection !== section) {
                    return this.loadHubData(activeSection);
                }
            }
            this.state.sections = sections;
            this.state.cards = payload.cards || [];
            this.state.groups = payload.groups || [];
            this.state.activeSection = activeSection;
            this.hubService.setStoredSection(this.app, activeSection);
        } finally {
            this.state.loading = false;
        }
    }

    onCardClick(card) {
        return this.hubService.openCard(card, this.app, this.state.activeSection);
    }
}
