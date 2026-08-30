/** @odoo-module **/

import { registry } from "@web/core/registry";
import { SalesHub } from "./sales_hub";

registry.category("actions").add("modoops_sales_hub", SalesHub);
