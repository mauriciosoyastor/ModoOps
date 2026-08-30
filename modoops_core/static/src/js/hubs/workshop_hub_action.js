/** @odoo-module **/

import { registry } from "@web/core/registry";
import { WorkshopHub } from "./workshop_hub";

registry.category("actions").add("modoops_workshop_hub", WorkshopHub);
