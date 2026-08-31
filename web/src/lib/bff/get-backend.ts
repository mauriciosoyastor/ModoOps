import { OdooAdapter } from "./odoo-adapter.ts";
import type { BackendClient } from "./backend-client.ts";

let cached: BackendClient | undefined;

function env(name: "ODOO_URL" | "ODOO_DB" | "ODOO_RPC_TIMEOUT_MS"): string | undefined {
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  if (fromMeta) return fromMeta;
  if (typeof process !== "undefined" && (process as unknown as { env?: Record<string, string> })?.env?.[name]) {
    return (process as unknown as { env: Record<string, string> }).env[name];
  }
  return undefined;
}

export function getRpcTimeoutMs(): number {
  const raw = Number(env("ODOO_RPC_TIMEOUT_MS"));
  if (Number.isFinite(raw) && raw >= 1000) return Math.floor(raw);
  return 15_000;
}

export function getBackendEnv(): { baseUrl: string; db: string } {
  const baseUrl = env("ODOO_URL") || "http://localhost:8070";
  const db = env("ODOO_DB") || "modoops_master";
  return { baseUrl, db };
}

export function getBackend(): BackendClient {
  if (!cached) {
    const { baseUrl, db } = getBackendEnv();
    cached = new OdooAdapter({ baseUrl, db, timeoutMs: getRpcTimeoutMs() });
  }
  return cached;
}

export function getTenantBackend(slug: string): BackendClient {
  const { baseUrl } = getBackendEnv();
  const safe = slug.replace(/[^a-z0-9_]/g, "");
  const db = `modoops_${safe}`;
  return new OdooAdapter({ baseUrl, db, timeoutMs: getRpcTimeoutMs() });
}

export function getBackendForDb(db: string): BackendClient {
  const { baseUrl } = getBackendEnv();
  return new OdooAdapter({ baseUrl, db, timeoutMs: getRpcTimeoutMs() });
}

export function __setBackendForTests(backend: BackendClient | undefined) {
  if (process.env.NODE_ENV !== "test") return;
  cached = backend;
}

export function resetBackendCache(): void {
  cached = undefined;
}
