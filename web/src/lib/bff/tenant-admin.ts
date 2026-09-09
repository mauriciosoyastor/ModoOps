/** Acciones de estado de tenant (G10) — puro: whitelist + validación. */

export const STATE_ACTIONS = ["suspend", "reactivate"] as const;
export type StateAction = (typeof STATE_ACTIONS)[number];

const METHOD: Record<StateAction, string> = {
  suspend: "action_suspend",
  reactivate: "action_reactivate",
};

export type ParsedStateAction = { ok: true; method: string } | { ok: false; message: string };

/** Valida el body del endpoint: id entero + acción conocida. */
export function parseStateAction(body: unknown): ParsedStateAction & { id?: number } {
  if (!body || typeof body !== "object") return { ok: false, message: "Falta acción" };
  const b = body as Record<string, unknown>;
  const id = Number(b.id);
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Tenant inválido" };
  const action = String(b.action || "") as StateAction;
  if (!(STATE_ACTIONS as readonly string[]).includes(action)) {
    return { ok: false, message: "Acción inválida (suspend | reactivate)" };
  }
  return { ok: true, id, method: METHOD[action] };
}
