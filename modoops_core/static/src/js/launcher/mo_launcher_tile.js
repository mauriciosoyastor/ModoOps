/** @odoo-module **/

import { Component } from "@odoo/owl";

import { chipLabel, deltaDirection, formatDelta } from "../hubs/mo_hub_delta.js";

export class SgLauncherTile extends Component {
    static template = "modoops_core.SgLauncherTile";
    static props = {
        tile: Object,
        loading: { type: Boolean, optional: true },
        onClick: Function,
    };

    /** "+25 %" listo para rendir; "" = sin delta (card sin scope de fecha). */
    get deltaText() {
        return formatDelta(this.props.tile.delta_pct);
    }

    /** up / down / flat / none — clase del chip de delta. */
    get deltaDir() {
        return deltaDirection(this.props.tile.delta_pct);
    }

    /** "Revisar" en warning; "" = sin chip. Nunca color solo. */
    get chipText() {
        return chipLabel(this.props.tile.variant);
    }

    /** Tile operable por teclado (web/AGENTS.md MUST): Enter/Espacio = click. */
    onTileKeydown(ev) {
        if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            return this.props.onClick(this.props.tile);
        }
    }
}
