/** Estado del tenant por request (fix G3) — lógica pura + cache TTL, testeable sin Odoo.
 *
 * El gate antes solo corría en el login: una sesión emitida sobrevivía a la
 * suspensión. Este módulo permite re-validar `slug → gate` en cada request
 * protegido con un cache corto en memoria (default 45s): la suspensión tarda
 * como máximo TTL en propagarse, y se evita un login-master por request (G4).
 *
 * Fail-open: si master no responde, se permite el request (la sesión ya fue
 * validada al emitirse). Falla cerrada real queda para el login (503).
 */

import { OdooAdapter } from "./odoo-adapter.ts";
import { getBackendEnv, getEnv } from "./config.ts";
import { BffError } from "./errors.ts";
import { resolveTenantGate, type TenantGateResult, type TenantGateTenant } from "./tenant-gate.ts";

export const DEFAULT_GATE_TTL_MS = 45_000;

export function resolveGateTtlMs(raw: string | undefined): number {
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 5_000) return Math.floor(n);
  return DEFAULT_GATE_TTL_MS;
}

export type TenantStateFetcher = (slug: string) => Promise<TenantGateTenant | null>;

export type GateCacheOptions = {
  ttlMs?: number;
  now?: () => number;
  fetchState?: TenantStateFetcher;
};

export type GateCache = {
  /** Gate vigente para el slug (usa cache; ante error de master, fail-open 200). */
  getGate(slug: string): Promise<TenantGateResult>;
  invalidate(slug: string): void;
  clear(): void;
};

export function createGateCache(options: GateCacheOptions = {}): GateCache {
  const ttlMs = options.ttlMs ?? DEFAULT_GATE_TTL_MS;
  const now = options.now ?? Date.now;
  const fetchState = options.fetchState ?? fetchTenantState;
  const memo = new Map<string, { at: number; result: TenantGateResult }>();

  return {
    async getGate(slug: string): Promise<TenantGateResult> {
      const hit = memo.get(slug);
      if (hit && now() - hit.at < ttlMs) return hit.result;
      let result: TenantGateResult;
      try {
        const tenant = await fetchState(slug);
        result = resolveTenantGate(tenant);
      } catch (e) {
        // Config rota = fail-closed ruidoso; master caído = fail-open
        // (la sesión ya era válida al emitirse).
        if (e instanceof BffError && e.code === "misconfigured") throw e;
        return { http: 200 };
      }
      memo.set(slug, { at: now(), result });
      return result;
    },
    invalidate(slug: string): void {
      memo.delete(slug);
    },
    clear(): void {
      memo.clear();
    },
  };
}

/** Lee el estado vivo del tenant en master (sesión de servicio efímera). */
export async function fetchTenantState(slug: string): Promise<TenantGateTenant | null> {
  return withMasterSession(async (master, sessionId) => {
    const tenant = await master.getTenantBySlug(sessionId, slug);
    if (!tenant) return null;
    return { state: tenant.state, abono_due_date: tenant.abono_due_date };
  });
}

/** Gate estricto (sin cache) para el login: la suspensión rige al instante. */
export async function getFreshGate(slug: string, cache?: GateCache): Promise<TenantGateResult> {
  const c = cache ?? getGateCache();
  c.invalidate(slug);
  return c.getGate(slug);
}

/** Audita un login bloqueado (403). Nunca revienta: es best-effort. */
export async function auditGateBlock(slug: string, login: string, deps: MasterDeps = {}): Promise<void> {
  try {
    await withMasterSession(async (master, sessionId) => {
      const tenant = await master.getTenantBySlug(sessionId, slug);
      if (tenant) {
        await master
          .auditTenantLog(sessionId, tenant.id, "login_bloqueado", `${tenant.state} — ${login}`)
          .catch(() => {});
      }
    }, deps);
  } catch {
    // master caído: el 403 ya salió, la auditoría se pierde (documentado)
  }
}

export type MasterApi = {
  getTenantBySlug(sessionId: string, slug: string): Promise<{ id: number; state: string; abono_due_date: string | false } | null>;
  auditTenantLog(sessionId: string, tenantId: number, action: string, detail?: string): Promise<void>;
  createLead(sessionId: string, vals: Record<string, unknown>): Promise<{ id: number }>;
  quotePreview(sessionId: string, vals: {
    vertical: string;
    modulos_tildados: string;
    sucursales: number;
    almacenes: number;
    cajas_pos: number;
    sku_count: number;
    anexo_fiscal_ref?: string;
  }): Promise<{ lista_cerrada: { key: string; modoops: string }[]; precio: Record<string, unknown>; propuesta: { comercial_md: string; validez: number }; errors: string[]; warnings: string[]; hash: string }>;
  login(login: string, password: string): Promise<{ sessionId: string }>;
  logout(sessionId: string): Promise<void>;
};

export type MasterDeps = {
  openMaster?: () => Promise<{ master: MasterApi; sessionId: string; close: () => Promise<void> }>;
};

/** Credenciales de servicio master (G4): sin default silencioso.
 * Lee env unificado (Astro dotenv + process): en contenedor manda compose,
 * en dev local manda web/.env. Faltantes = BffError misconfigured (500). */
export function getMasterCredentials(env?: Record<string, string | undefined>): { login: string; password: string } {
  const e = env ?? getEnv();
  const login = ((e.ODOO_ADMIN_LOGIN as string) || "").trim();
  const password = ((e.ODOO_ADMIN_PASSWORD as string) || "").trim();
  if (!login || !password) {
    throw new BffError("misconfigured", 500, "Falta ODOO_ADMIN_LOGIN/PASSWORD");
  }
  return { login, password };
}

/** Sesión master de servicio para un bloque (login/logout incluidos). */
export async function withMasterSession<T>(
  fn: (master: MasterApi, sessionId: string) => Promise<T>,
  deps: MasterDeps = {}
): Promise<T> {
  if (deps.openMaster) {
    const { master, sessionId, close } = await deps.openMaster();
    try {
      return await fn(master, sessionId);
    } finally {
      await close().catch(() => {});
    }
  }
  const { baseUrl } = getBackendEnv();
  const { login, password } = getMasterCredentials();
  const master = new OdooAdapter({ baseUrl, db: "modoops_master" });
  const { sessionId } = await master.login(login, password);
  try {
    return await fn(master, sessionId);
  } finally {
    await master.logout(sessionId).catch(() => {});
  }
}

/** Singleton para el middleware (un cache por proceso). */
let cached: GateCache | undefined;

export function getGateCache(): GateCache {
  if (!cached) {
    const env = (typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>;
    cached = createGateCache({ ttlMs: resolveGateTtlMs(env.BFF_GATE_TTL_MS) });
  }
  return cached;
}

/** Reset factory cache (tests). */
export function resetGateCache(): void {
  cached = undefined;
}
