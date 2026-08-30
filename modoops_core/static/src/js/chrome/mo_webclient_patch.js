/** @odoo-module **/

import { WebClient } from "@web/webclient/webclient";
import { SgRailNav } from "./mo_rail_nav";
import { SgMobileBottomBar } from "./mo_mobile_bottom_bar";

WebClient.components = {
    ...WebClient.components,
    SgRailNav,
    SgMobileBottomBar,
};
