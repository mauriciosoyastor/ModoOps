/** @odoo-module **/

import { registry } from "@web/core/registry";
import { InventoryHub } from "./inventory_hub";

registry.category("actions").add("modoops_inventory_hub", InventoryHub);
