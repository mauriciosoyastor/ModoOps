/** @odoo-module **/

import { Component } from "@odoo/owl";

import { SgLauncherTile } from "../launcher/mo_launcher_tile";

import { pendingCards } from "./mo_hub_delta.js";

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

    /** Cards warning/pending para "Acciones pendientes ›" (ticket 10). */
    get pendingCards() {

        return pendingCards(this.props.cards);

    }

    onPendingKeydown(ev, card) {

        if (ev.key === "Enter" || ev.key === " ") {

            ev.preventDefault();

            return this.onTileClick(card);

        }

    }

}
