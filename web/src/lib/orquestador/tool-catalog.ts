/** Tool Catalog SSOT — port de modoops_ia/logic/tool_schemas.py
 *  Define TOOL_CATALOG y validadores puros sin Odoo.
 *  Single-source: este catálogo es espejo de Python; diverge => CI debe fallar.
 */

export type ToolDef = {
  name: string;
  label: string;
  input_schema: { type: string; properties?: Record<string, { type: string; enum?: string[]; minimum?: number }>; required?: string[] };
  groups_required: string[];
  module_required: string | null;
  kind: "read" | "write";
};

export const TOOL_CATALOG: ToolDef[] = [
  {
    name: "echo",
    label: "Echo (dummy para Orquestador)",
    input_schema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] },
    groups_required: [],
    module_required: null,
    kind: "read",
  },
  {
    name: "stock.consulta",
    label: "Consultar stock por producto",
    input_schema: { type: "object", properties: { product_id: { type: "integer" }, location_id: { type: "integer" } }, required: ["product_id"] },
    groups_required: ["stock.group_stock_user"],
    module_required: "stock",
    kind: "read",
  },
  {
    name: "ot.cobro",
    label: "Cobro de OT en caja",
    input_schema: {
      type: "object",
      properties: {
        work_order_id: { type: "integer" },
        amount: { type: "number", minimum: 0.01 },
        medium: { type: "string", enum: ["cash", "transfer", "card", "other"] },
      },
      required: ["work_order_id", "amount"],
    },
    groups_required: ["base.group_user"],
    module_required: "modoops_core",
    kind: "write",
  },
];

const CATALOG_BY_NAME = new Map(TOOL_CATALOG.map((t) => [t.name, t]));
const SLUG_RE = /^[a-z0-9]+(?:[._][a-z0-9]+)*$/;

export function toolExists(name: string): boolean {
  return CATALOG_BY_NAME.has(name);
}

export function catalogNames(): string[] {
  return [...CATALOG_BY_NAME.keys()].sort();
}

export function validateToolInput(toolName: string, payload: Record<string, unknown>): [boolean, string | null] {
  const tool = CATALOG_BY_NAME.get(toolName);
  if (!tool) return [false, `Tool desconocida '${toolName}'`];
  if (!SLUG_RE.test(toolName)) return [false, "Nombre de tool inválido"];
  const schema = tool.input_schema || { required: [], properties: {} };
  const required = schema.required || [];
  const props = schema.properties || {};
  for (const field of required) {
    if (!(field in payload)) return [false, `Falta campo requerido '${field}'`];
  }
  for (const [key, value] of Object.entries(payload)) {
    const prop = (props as Record<string, { type: string; enum?: string[]; minimum?: number }>)[key];
    if (!prop) continue;
    const t = prop.type;
    if (t === "integer" && !Number.isInteger(value)) return [false, `Campo '${key}' debe ser entero`];
    if (t === "number" && typeof value !== "number") return [false, `Campo '${key}' debe ser número`];
    if (t === "string" && typeof value !== "string") return [false, `Campo '${key}' debe ser texto`];
    if ("enum" in prop && prop.enum && !prop.enum.includes(value as string)) return [false, `Campo '${key}' fuera de enum`];
    if ("minimum" in prop && typeof value === "number" && value < (prop.minimum as number)) return [false, `Campo '${key}' por debajo del mínimo`];
  }
  return [true, null];
}
