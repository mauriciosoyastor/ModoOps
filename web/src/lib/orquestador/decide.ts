/** Orquestador BFF — lógica pura (port de modoops_ia/logic/orchestrator.py)
 *  Valida auth, suspensión, techo, rate-limit y produce decisión antes de tocar Odoo.
 *  Inyecta dependencias para no acoplar a DB/env real (testeable con fakes).
 *  Deep module: tapa chica (decide), mucho adentro (adapters).
 */

import { validateToolInput, toolExists as defaultToolExists } from "./tool-catalog.ts";

export type DecideArgs = {
  db: string;
  tool: string;
  input: unknown;
  requestId: string;
  apiKey: string | null;
  // inyectables — adapters
  validateApiKey: (db: string, apiKey: string) => boolean | Promise<boolean>;
  isSuspended: (db: string) => { suspended: boolean; reason?: string | null } | Promise<{ suspended: boolean; reason?: string | null }>;
  isQuotaExceeded: (db: string) => boolean | Promise<boolean>;
  toolExists?: (tool: string) => boolean;
  checkRateLimit?: (db: string, tool: string, input: unknown) => Promise<{ allowed: boolean; code?: string; error?: string; retryAfter?: number }>;
};

export type DecideResult =
  | { http: 200; status: "ok" }
  | { http: number; status: "error" | "needs_tool"; error: string; code?: string; retryAfter?: number };

export async function decide(args: DecideArgs): Promise<DecideResult> {
  const { db, tool, input, requestId, apiKey, validateApiKey, isSuspended, isQuotaExceeded, toolExists, checkRateLimit } = args;

  if (!db || !db.startsWith("modoops_")) {
    return { http: 400, status: "error", error: "db_name inválido", code: "invalid_db" };
  }
  const slug = db.replace(/^modoops_/, "");
  if (!/^[a-z0-9_]+$/.test(slug)) {
    return { http: 400, status: "error", error: "slug inválido", code: "invalid_db" };
  }
  if (!requestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return { http: 400, status: "error", error: "requestId requerido UUID v4", code: "missing_requestId" };
  }
  if (!tool || typeof tool !== "string") {
    return { http: 400, status: "error", error: "tool requerida", code: "missing_tool" };
  }

  const validKey = await validateApiKey(db, apiKey ?? "");
  if (!validKey) {
    return { http: 401, status: "error", error: "apiKey inválida", code: "unauthorized" };
  }

  const susp = await isSuspended(db);
  if (susp.suspended) {
    return { http: 403, status: "error", error: susp.reason || "Tenant suspendido", code: "tenant_suspended" };
  }

  if (checkRateLimit) {
    const rl = await checkRateLimit(db, tool, input);
    if (!rl.allowed) {
      return { http: 429, status: "error", error: rl.error || "rate limit", code: rl.code || "rate_limited", retryAfter: rl.retryAfter };
    }
  }

  const quotaExceeded = await isQuotaExceeded(db);
  if (quotaExceeded) {
    return { http: 429, status: "error", error: "Techo IA excedido", code: "quota_exceeded" };
  }

  const exists = toolExists ? toolExists(tool) : defaultToolExists(tool);
  if (!exists) {
    return { http: 422, status: "needs_tool", error: `Tool '${tool}' no existe en Catálogo`, code: "unknown_tool" };
  }

  const payload = (input ?? {}) as Record<string, unknown>;
  // validateToolInput expects dict
  const obj = typeof payload === "object" && payload !== null && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
  const [ok, err] = validateToolInput(tool, obj);
  if (!ok) {
    // diferencia entre needs_tool y error de input: si err menciona Tool desconocida, ya handled arriba
    return { http: 422, status: "error", error: err || "input inválido", code: "invalid_input" };
  }

  return { http: 200, status: "ok" };
}
