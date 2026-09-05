/** BFF Config — deep module, single env parser (locality)
 *  Centraliza toda lectura de env para BFF (TTL, storeKind, Odoo URL/DB, RPC timeout, cookie).
 *  Un solo parser, no 4 copias en session-store/get-backend/orquestador/adapters.
 *  Tapa chica: callers solo conocen `getBffConfig()` y constantes.
 */

export const BFF_COOKIE = "mo_bff_sid";
export const DEFAULT_SESSION_TTL_SECONDS = 12 * 60 * 60;

export type BffEnv = Record<string, string | undefined>;

function readEnv(): BffEnv {
  // unifica import.meta.env, process.env y Cloudflare locals.runtime.env (inyectado via getEnv)
  // callers que tienen `locals` deben pasar `getEnv(locals)` explícito; aquí fallback global
  const fromMeta = (typeof import.meta !== "undefined" ? (import.meta.env as BffEnv) : {}) ?? {};
  const fromProcess = (typeof process !== "undefined" ? (process as unknown as { env?: BffEnv })?.env : {}) ?? {};
  const fromGlobal = (globalThis as unknown as { env?: BffEnv })?.env ?? {};
  return { ...fromProcess, ...fromGlobal, ...fromMeta } as BffEnv;
}

export function getEnv(locals?: unknown): BffEnv {
  const l = locals as Record<string, unknown> & { runtime?: { env?: BffEnv } } | undefined;
  const fromLocals = l?.runtime?.env ?? {};
  return { ...readEnv(), ...fromLocals } as BffEnv;
}

export function getSessionTtlSeconds(env?: BffEnv): number {
  const e = env ?? readEnv();
  const raw = e.BFF_SESSION_TTL_SECONDS;
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return DEFAULT_SESSION_TTL_SECONDS;
}

export function resolveTtl(ttlSeconds?: number): number {
  if (ttlSeconds !== undefined && Number.isFinite(ttlSeconds) && ttlSeconds >= 0) return ttlSeconds;
  return DEFAULT_SESSION_TTL_SECONDS;
}

export function resolveStoreKind(env?: BffEnv): "memory" | "file" {
  const e = env ?? readEnv();
  const raw = (e.BFF_SESSION_STORE || "").toLowerCase();
  if (raw === "file" || raw === "memory") return raw;
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") return "memory";
  return "file";
}

export function defaultSessionDir(env?: BffEnv): string {
  const e = env ?? readEnv();
  if (e.BFF_SESSION_DIR) return e.BFF_SESSION_DIR as string;
  // join(process.cwd(), ".data", "bff-sessions") — lazy import para no romper edge
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { join } = require("node:path");
    return join(process.cwd(), ".data", "bff-sessions");
  } catch {
    return ".data/bff-sessions";
  }
}

export function getBackendEnv(env?: BffEnv): { baseUrl: string; db: string } {
  const e = env ?? readEnv();
  const baseUrl = (e.ODOO_URL as string) || "http://localhost:8070";
  const db = (e.ODOO_DB as string) || "modoops_master";
  return { baseUrl, db };
}

export function getRpcTimeoutMs(env?: BffEnv): number {
  const e = env ?? readEnv();
  const raw = Number(e.ODOO_RPC_TIMEOUT_MS);
  if (Number.isFinite(raw) && raw >= 1000) return Math.floor(raw);
  return 15_000;
}

export function getOdooEnv(name: "ODOO_URL" | "ODOO_DB" | "ODOO_RPC_TIMEOUT_MS", env?: BffEnv): string | undefined {
  const e = env ?? readEnv();
  return e[name] as string | undefined;
}

export function getVideoAccessUrl(env?: BffEnv): string | undefined {
  const e = env ?? readEnv();
  const raw = (e.VIDEO_ACCESS_URL as string) || "";
  return raw ? raw : undefined;
}
