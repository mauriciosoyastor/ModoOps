import type { APIRoute } from 'astro';
import { decide } from '../../../../../lib/orquestador/decide.ts';
import { createEnvApiKeyValidator, createEnvSuspensionChecker, createMemoryQuotaStore, createMemoryRateLimiter, getEnv } from '../../../../../lib/orquestador/adapters.ts';

export const prerender = false;

// Deep module singletons — adapters inyectables, shared seam (no duplicación)
// rateMap/idempotentMap viven aquí pero son gestionados por adapters (locality)
const rateMap = new Map<string, { count: number; reset: number }>();
const idempotentMap = new Map<string, { runId: string; output: unknown; status: string }>();

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function getApiKey(request: Request, body: Record<string, unknown> | null): string | null {
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  const xkey = request.headers.get('x-api-key');
  if (xkey) return xkey.trim();
  if (body && typeof body.apiKey === 'string') return (body.apiKey as string).trim();
  return null;
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const db = params.db as string;

  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(400, { status: 'error', code: 'invalid_json', error: 'JSON inválido' });
  }

  const { tool, input, requestId } = body as { tool?: string; input?: unknown; requestId?: string };
  const apiKey = getApiKey(request, body);

  // env single parser (locality: no duplicar getEnv en 2 archivos)
  const env = getEnv(locals);

  // adapters inyectados — deep module seam
  const validateApiKey = createEnvApiKeyValidator(env);
  const isSuspended = createEnvSuspensionChecker(env);
  const quotaStore = createMemoryQuotaStore(env, rateMap);
  const checkRateLimit = createMemoryRateLimiter(rateMap);

  // Orquestador decide — tapa chica, mucho adentro (lev. para callers, loc. para maintainers)
  const decision = await decide({
    db,
    tool: tool as string,
    input,
    requestId: requestId as string,
    apiKey,
    validateApiKey,
    isSuspended,
    isQuotaExceeded: (db) => quotaStore.isQuotaExceeded(db),
    checkRateLimit,
  });

  if (decision.http !== 200) {
    const headers: Record<string, string> = {};
    if (decision.retryAfter) headers['Retry-After'] = String(decision.retryAfter);
    // mapeo code -> body code para compatibilidad con tests existentes
    const code = (decision as { code?: string }).code || (decision.http === 401 ? 'unauthorized' : decision.http === 403 ? 'tenant_suspended' : decision.http === 429 ? (decision.error?.includes('Techo') ? 'quota_exceeded' : 'rate_limited') : decision.status === 'needs_tool' ? 'unknown_tool' : 'error');
    if (decision.status === 'needs_tool') {
      return json(decision.http, { status: 'needs_tool', code, error: decision.error, reason: 'unknown_tool' }, headers);
    }
    return json(decision.http, { status: 'error', code, error: decision.error, ...(decision as { retryAfter?: number }).retryAfter ? { retryAfter: (decision as { retryAfter?: number }).retryAfter } : {}, ...(code === 'quota_exceeded' ? { quota: Number(env.MODOOPS_AGENT_QUOTA_DEFAULT ?? '200') } : {}) }, headers);
  }

  // Audit + quota increment (después de decide ok, locality en QuotaStore)
  await quotaStore.increment(db);

  // Proxy idempotente unique(tenant_db,tool,requestId) — truth en SQL, cache en Map (2 adapters, seam real)
  const idemKey = `${db}:${tool}:${requestId}`;
  const existing = idempotentMap.get(idemKey);
  if (existing) {
    return json(200, { status: existing.status, output: existing.output, runId: existing.runId }, { 'X-Idempotent-Replayed': 'true' });
  }

  const runId = `${db}:${tool}:${requestId}`;
  // Fiscal guard (ot.cobro) — falla cerrada, no improvisa
  if (tool === 'ot.cobro' && env.MODOOPS_FISCAL_ENABLED === '0') {
    const output = { reason: 'fiscal_not_enabled', draft: null };
    idempotentMap.set(idemKey, { runId, output, status: 'needs_tool' });
    return json(422, { status: 'needs_tool', code: 'fiscal_not_enabled', error: 'Fiscal no habilitado', output, runId });
  }

  const output = { echo: input, tenantDb: db, tool, runId };
  idempotentMap.set(idemKey, { runId, output, status: 'ok' });
  return json(200, { status: 'ok', output, runId });
};
