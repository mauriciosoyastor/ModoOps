/** @odoo-module **/

import { Component } from "@odoo/owl";
import { SgLauncherTile } from "../launcher/mo_launcher_tile";

export class SgHubSectionBody extends Component {
    static template = "modoops_core.SgHubSectionBody";
    static components = { SgLauncherTile };
    static props = {
        cards: Array,
        groups: { type: Array, optional: true },
        loading: { type: Boolean, optional: true },
        onCardClick: Function,
    };

    onTileClick(card) {
        return this.props.onCardClick(card);
    }
}
