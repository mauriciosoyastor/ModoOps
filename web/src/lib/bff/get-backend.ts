import { OdooAdapter } from "./odoo-adapter.ts";
import type { BackendClient } from "./backend-client.ts";
import { getBackendEnv, getRpcTimeoutMs, getEnv } from "./config.ts";

// Deep module factory — pura, sin side-effects globales (locality)
// `cached` se mantiene por compat, pero la factory es inyectable via fetchImpl para tests.

let cached: BackendClient | undefined;

export { getBackendEnv, getRpcTimeoutMs };

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

/** @deprecated solo tests — seam hipotético, usar factory pura con fetchImpl */
export function __setBackendForTests(backend: BackendClient | undefined) {
  if (process.env.NODE_ENV !== "test") return;
  cached = backend;
}

export function resetBackendCache(): void {
  cached = undefined;
}

/** Factory pura para tests — no usa global */
export function createBackend(opts: { baseUrl: string; db: string; fetchImpl?: typeof fetch; timeoutMs?: number }): BackendClient {
  return new OdooAdapter({ baseUrl: opts.baseUrl, db: opts.db, fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? getRpcTimeoutMs() });
}
