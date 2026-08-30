/** @odoo-module **/

import { Component } from "@odoo/owl";

export class SgSectionRail extends Component {
    static template = "modoops_core.SgSectionRail";
    static props = {
        sections: Array,
        activeSection: String,
        expanded: Boolean,
        appLabel: { type: String, optional: true },
        onSelect: Function,
        onToggle: Function,
    };
}
