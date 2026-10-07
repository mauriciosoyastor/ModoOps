/** Adapters para Orquestador — deep module con 2+ implementaciones por seam (real seam)
 *  Cada adapter satisface una parte de la `interface` decide.
 *  Production: env/KV/Odoo. Tests: Memory fakes.
 */

// --- ApiKeyStore ---
export async function hmacCompare(provided: string, stored: string): Promise<boolean> {
  const isHash = /^[a-f0-9]{64}$/i.test(stored);
  if (isHash) {
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest("SHA-256", enc.encode(provided));
    const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    let diff = 0;
    for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ stored.charCodeAt(i);
    return diff === 0 && hex.length === stored.length;
  }
  if (provided.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ stored.charCodeAt(i);
  return diff === 0;
}

export function createEnvApiKeyValidator(env: Record<string, string>) {
  return async (db: string, apiKey: string): Promise<boolean> => {
    const slug = db.replace(/^modoops_/, "").toUpperCase();
    const expected = env[`MODOOPS_AGENT_API_KEY_${slug}`] ?? env.MODOOPS_AGENT_API_KEY ?? env.MODOOPS_AGENT_API_KEY_DEFAULT;
    if (!expected) return false; // fail-closed: sin key configurada no se autoriza (dev debe setear .env)
    if (!apiKey) return false;
    return hmacCompare(apiKey, expected);
  };
}

// --- SuspensionStore ---
export function createEnvSuspensionChecker(env: Record<string, string>) {
  return async (db: string): Promise<{ suspended: boolean; reason?: string | null }> => {
    const slug = db.replace(/^modoops_/, "").toUpperCase();
    const suspended = env[`MODOOPS_TENANT_SUSPENDED_${slug}`] === "1";
    if (suspended) return { suspended: true, reason: "Tenant suspendido — regularizá abono" };
    return { suspended: false, reason: null };
  };
}

export type SuspensionChecker = (db: string) => Promise<{ suspended: boolean; reason?: string | null }>;
export type GateFetcher = (slug: string) => Promise<{ http: number; code?: string; message?: string }>;

/** Suspensión env OR master: env bloquea primero (rápido); master solo puede bloquear.
 *  Master caído/mal configurado = fail-open a env (la sesión ya era válida al emitirse).
 */
export function createCompositeSuspensionChecker(envChecker: SuspensionChecker, getGate: GateFetcher): SuspensionChecker {
  return async (db: string): Promise<{ suspended: boolean; reason?: string | null }> => {
    const envRes = await envChecker(db);
    if (envRes.suspended) return envRes;
    const slug = db.replace(/^modoops_/, "");
    try {
      const gate = await getGate(slug);
      if (gate && gate.http === 403) {
        return { suspended: true, reason: gate.message ?? "Tenant suspendido — regularizá abono" };
      }
    } catch (e) {
      // Config rota = fail-closed ruidoso (mirror tenant-status.ts); master caído = fail-open a env.
      if ((e as { code?: string })?.code === "misconfigured") throw e;
    }
    return envRes;
  };
}

// --- QuotaStore (Techo IA 200/mes) ---
export type QuotaStore = {
  isQuotaExceeded: (db: string) => Promise<boolean>;
  increment: (db: string) => Promise<void>;
};
export function createMemoryQuotaStore(env: Record<string, string>, monthMap: Map<string, { count: number; reset: number }>): QuotaStore {
  return {
    async isQuotaExceeded(db: string): Promise<boolean> {
      const slug = db.replace(/^modoops_/, "").toUpperCase();
      const quota = Number(env[`MODOOPS_AGENT_QUOTA_${slug}`] ?? env.MODOOPS_AGENT_QUOTA_DEFAULT ?? "200");
      const now = Date.now();
      const monthKey = `quota:${db}:${new Date().toISOString().slice(0, 7)}`;
      const entry = monthMap.get(monthKey);
      const used = entry && entry.reset > now ? entry.count : 0;
      return used >= quota;
    },
    async increment(db: string): Promise<void> {
      const now = Date.now();
      const monthKey = `quota:${db}:${new Date().toISOString().slice(0, 7)}`;
      const entry = monthMap.get(monthKey);
      if (entry && entry.reset > now) entry.count++;
      else monthMap.set(monthKey, { count: 1, reset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime() });
    },
  };
}

/** Cuota mensual para un db (misma fuente que createMemoryQuotaStore). */
export function quotaFor(env: Record<string, string>, db: string): number {
  const slug = db.replace(/^modoops_/, "").toUpperCase();
  return Number(env[`MODOOPS_AGENT_QUOTA_${slug}`] ?? env.MODOOPS_AGENT_QUOTA_DEFAULT ?? "200");
}

/** Inicio del mes en curso (ISO, medianoche UTC) para filtrar create_date en Odoo. */
export function monthStartIso(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
}

export type QuotaExceededChecker = (db: string) => boolean | Promise<boolean>;

/** Quota memoria OR master: memoria primero (barato, sin red); master solo suma.
 *  Master caído = fail-open a memoria (coherente con suspensión).
 */
export function createCompositeQuotaChecker(
  memoryExceeded: QuotaExceededChecker,
  masterExceeded: QuotaExceededChecker
): (db: string) => Promise<boolean> {
  return async (db: string): Promise<boolean> => {
    if (await memoryExceeded(db)) return true;
    try {
      return await masterExceeded(db);
    } catch {
      return false;
    }
  };
}

// --- RateLimiter (tenant 10/min, tool 30/min, loop 5x) ---
export function createMemoryRateLimiter(rateMap: Map<string, { count: number; reset: number }>) {
  return async (db: string, tool: string, input: unknown): Promise<{ allowed: boolean; code?: string; error?: string; retryAfter?: number }> => {
    const now = Date.now();
    const tenantKey = `rl:${db}`;
    const toolKey = `rl:${db}:${tool}`;
    const tenantEntry = rateMap.get(tenantKey);
    if (tenantEntry && tenantEntry.reset > now) {
      if (tenantEntry.count >= 10) {
        const retry = Math.ceil((tenantEntry.reset - now) / 1000);
        return { allowed: false, code: "rate_limited", error: "rate limit Tenant 10/min", retryAfter: retry };
      }
      tenantEntry.count++;
    } else {
      rateMap.set(tenantKey, { count: 1, reset: now + 60_000 });
    }
    const toolEntry = rateMap.get(toolKey);
    if (toolEntry && toolEntry.reset > now) {
      if (toolEntry.count >= 30) {
        const retry = Math.ceil((toolEntry.reset - now) / 1000);
        return { allowed: false, code: "rate_limited", error: "rate limit Tool 30/min", retryAfter: retry };
      }
      toolEntry.count++;
    } else {
      rateMap.set(toolKey, { count: 1, reset: now + 60_000 });
    }
    const inputHash = JSON.stringify(input ?? null);
    const loopKey = `loop:${db}:${tool}:${inputHash}`;
    const loopEntry = rateMap.get(loopKey);
    if (loopEntry && loopEntry.reset > now && loopEntry.count >= 5) {
      return { allowed: false, code: "rate_limited", error: "loop detectado 5× mismo input en 60s" };
    }
    if (loopEntry && loopEntry.reset > now) loopEntry.count++;
    else rateMap.set(loopKey, { count: 1, reset: now + 60_000 });
    return { allowed: true };
  };
}

// --- Helpers for env extraction (single parser, no duplication) ---
export function getEnv(locals: unknown): Record<string, string> {
  const l = locals as Record<string, unknown> & { runtime?: { env?: Record<string, string> } };
  const env = l?.runtime?.env ?? (globalThis as unknown as { env?: Record<string, string> })?.env ?? (typeof process !== "undefined" ? (process as unknown as { env?: Record<string, string> })?.env : undefined) ?? {};
  return env as Record<string, string>;
}
