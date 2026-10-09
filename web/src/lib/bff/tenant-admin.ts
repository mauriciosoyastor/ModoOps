/** Acciones de estado de tenant (G10) — puro: whitelist + validación. */

export const STATE_ACTIONS = ["suspend", "reactivate"] as const;
export type StateAction = (typeof STATE_ACTIONS)[number];

const METHOD = {
  suspend: "action_suspend",
  reactivate: "action_reactivate",
} as const satisfies Record<StateAction, "action_suspend" | "action_reactivate">;

export type TenantStateMethod = (typeof METHOD)[StateAction];

export type ParsedStateAction = { ok: true; method: TenantStateMethod } | { ok: false; message: string };

function isStateAction(value: string): value is StateAction {
  return value === "suspend" || value === "reactivate";
}

/** Valida el body del endpoint: id entero + acción conocida. */
export function parseStateAction(body: unknown): ParsedStateAction & { id?: number } {
  if (!body || typeof body !== "object") return { ok: false, message: "Falta acción" };
  const b = body as Record<string, unknown>;
  const id = Number(b.id);
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Tenant inválido" };
  const action = String(b.action || "");
  if (!isStateAction(action)) {
    return { ok: false, message: "Acción inválida (suspend | reactivate)" };
  }
  return { ok: true, id, method: METHOD[action] };
}
