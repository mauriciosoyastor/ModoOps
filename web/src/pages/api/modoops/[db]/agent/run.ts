import type { APIRoute } from 'astro';
import { decide } from '../../../../../lib/orquestador/decide.ts';
import { createEnvApiKeyValidator, createEnvSuspensionChecker, createCompositeSuspensionChecker, createMemoryQuotaStore, createMemoryRateLimiter, createCompositeQuotaChecker, quotaFor, monthStartIso, getEnv } from '../../../../../lib/orquestador/adapters.ts';
import { OdooAdapter } from '../../../../../lib/bff/odoo-adapter.ts';
import type { AgentExecuteEnvelope } from '../../../../../lib/bff/backend-client.ts';
import { BffError } from '../../../../../lib/bff/errors.ts';
import { getGateCache } from '../../../../../lib/bff/tenant-status.ts';
import { callLLM } from '../../../../../lib/orquestador/llm.ts';

export const prerender = false;

// Deep module singletons — adapters inyectables, shared seam (no duplicación)
// rateMap/idempotentMap viven aquí pero son gestionados por adapters (locality)
const rateMap = new Map<string, { count: number; reset: number }>();
const idempotentMap = new Map<string, { runId: string; output: unknown; status: string; code?: string; error?: string }>();

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/** Misma forma de respuesta en hit y miss: el replay devuelve lo que el miss daría. */
function outcomeResponse(status: string, code: string | undefined, error: string | undefined, output: unknown, runId: string, replayed: boolean) {
  const headers: Record<string, string> = replayed ? { 'X-Idempotent-Replayed': 'true' } : {};
  if (status === 'ok') return json(200, { status: 'ok', output, runId }, headers);
  const c = code ?? (status === 'needs_tool' ? 'unknown_tool' : 'error');
  return json(422, { status, code: c, error: error ?? 'Error', output, runId }, headers);
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

  let { tool, input, requestId, message } = body as { tool?: string; input?: unknown; requestId?: string; message?: string };
  const apiKey = getApiKey(request, body);

  // LLM hidratación: si viene message sin tool, resuelve tool/input via Ollama/mock (free)
  let llmSource: string | null = null;
  if (!tool && typeof message === "string" && message.trim()) {
    const llm = await callLLM(message);
    tool = llm.tool;
    input = llm.input;
    llmSource = llm.source;
  }

  // env single parser (locality: no duplicar getEnv en 2 archivos)
  const env = getEnv(locals);

  // adapters inyectados — deep module seam
  const validateApiKey = createEnvApiKeyValidator(env);
  // Suspensión env OR master (fail-open si master cae; master solo puede bloquear).
  // Nota: el gate de master cachea 45s (tenant-status TTL) — la suspensión tarda
  // como máximo eso en llegar a esta ruta; el login la aplica al instante.
  // Sin creds master (dev sin ODOO_ADMIN_*) se salta el gate: manda env.
  const gateCache = getGateCache();
  const hasMasterCreds = Boolean(env.ODOO_ADMIN_LOGIN?.trim() && env.ODOO_ADMIN_PASSWORD?.trim());
  const isSuspended = createCompositeSuspensionChecker(
    createEnvSuspensionChecker(env),
    (slug) => (hasMasterCreds ? gateCache.getGate(slug) : Promise.resolve({ http: 200 as const }))
  );
  const quotaStore = createMemoryQuotaStore(env, rateMap);
  const checkRateLimit = createMemoryRateLimiter(rateMap);

  // Techo IA (spec 0008): memoria OR conteo master en tenant.log action='agent.run'.
  // Sin creds master (dev) manda memoria; master caído = fail-open a memoria.
  // Desvío del spec: quota por env (no existe agent_quota_month en modoops.tenant).
  const masterBaseUrl = env.ODOO_URL || 'http://localhost:8070';
  async function withMasterTenant<T>(dbName: string, fn: (master: OdooAdapter, sessionId: string, tenantId: number) => Promise<T>): Promise<T | null> {
    const slug = dbName.replace(/^modoops_/, "");
    const master = new OdooAdapter({ baseUrl: masterBaseUrl, db: 'modoops_master' });
    const { sessionId } = await master.login(env.ODOO_ADMIN_LOGIN, env.ODOO_ADMIN_PASSWORD);
    try {
      const tenant = await master.getTenantBySlug(sessionId, slug);
      if (!tenant) return null;
      return await fn(master, sessionId, tenant.id);
    } finally {
      await master.logout(sessionId).catch(() => {});
    }
  }
  const masterQuotaExceeded = async (d: string): Promise<boolean> => {
    const usage = await withMasterTenant(d, (master, sessionId, tenantId) =>
      master.countAgentRuns(sessionId, tenantId, monthStartIso())
    );
    if (usage === null) return false;
    return usage >= quotaFor(env, d);
  };
  const isQuotaExceeded = createCompositeQuotaChecker(
    (d) => quotaStore.isQuotaExceeded(d),
    (d) => (hasMasterCreds ? masterQuotaExceeded(d) : Promise.resolve(false))
  );
  // Best-effort: audita la corrida en master para el conteo del Techo (item 5 lo reutiliza).
  const auditAgentRun = async (d: string, t: unknown, r: unknown): Promise<void> => {
    if (!hasMasterCreds) return;
    await withMasterTenant(d, (master, sessionId, tenantId) =>
      master.auditTenantLog(sessionId, tenantId, "agent.run", `${String(t)} ${String(r)}`.slice(0, 200))
    );
  };

  // Orquestador decide — tapa chica, mucho adentro (lev. para callers, loc. para maintainers)
  const decision = await decide({
    db,
    tool: tool as string,
    input,
    requestId: requestId as string,
    apiKey,
    validateApiKey,
    isSuspended,
    isQuotaExceeded,
    checkRateLimit,
  });

  if (decision.status !== "ok") {
    const headers: Record<string, string> = {};
    const retryAfter = decision.status === "error" && decision.http === 429 ? decision.retryAfter : undefined;
    if (retryAfter) headers["Retry-After"] = String(retryAfter);
    const code = decision.code;
    if (decision.status === "needs_tool") {
      return json(decision.http, { status: "needs_tool", code, error: decision.error, reason: "unknown_tool" }, headers);
    }
    return json(
      decision.http,
      {
        status: "error",
        code,
        error: decision.error,
        ...(retryAfter ? { retryAfter } : {}),
        ...(code === "quota_exceeded" ? { quota: quotaFor(env, db) } : {}),
      },
      headers
    );
  }

  // Proxy idempotente unique(tenant_db,tool,requestId) — truth en SQL, cache en Map (2 adapters, seam real)
  const idemKey = `${db}:${tool}:${requestId}`;
  const existing = idempotentMap.get(idemKey);
  if (existing) {
    return outcomeResponse(existing.status, existing.code, existing.error, existing.output, existing.runId, true);
  }

  // Audit + quota increment (solo corridas ejecutadas: ni el replay ni el
  // rechazo fiscal cuentan; el 422 no consumió corrida).
  // Memoria siempre; master best-effort (sin él, el Techo sigue en memoria).
  const runId = `${db}:${tool}:${requestId}`;
  // Fiscal guard (ot.cobro) — falla cerrada, no improvisa
  if (tool === 'ot.cobro' && env.MODOOPS_FISCAL_ENABLED === '0') {
    const output = { reason: 'fiscal_not_enabled', draft: null };
    idempotentMap.set(idemKey, { runId, output, status: 'needs_tool', code: 'fiscal_not_enabled', error: 'Fiscal no habilitado' });
    return json(422, { status: 'needs_tool', code: 'fiscal_not_enabled', error: 'Fiscal no habilitado', output, runId });
  }

  // Ejecución real en Tenant (spec 0008 + 4b): verdad en modoops.agent.run,
  // Map local solo caché L1. Sin Odoo → 503 (no se finge ejecución).
  // __fetchImpl es seam solo-tests (mirror __setBackendForTests).
  const fetchImpl = (locals as { __fetchImpl?: typeof fetch })?.__fetchImpl;
  const tenant = new OdooAdapter({ baseUrl: masterBaseUrl, db, fetchImpl });
  let envelope: AgentExecuteEnvelope;
  try {
    envelope = await tenant.executeAgentTool(apiKey ?? "", tool as string, input, requestId as string);
  } catch (e) {
    const status = e instanceof BffError ? e.status : 502;
    const code = e instanceof BffError ? e.code : "action_failed";
    return json(status, { status: 'error', code, error: e instanceof Error ? e.message : 'Error ejecutando herramienta', runId });
  }

  await quotaStore.increment(db);
  await auditAgentRun(db, tool, requestId).catch(() => {});
  idempotentMap.set(idemKey, { runId: envelope.runId ?? runId, output: envelope.output, status: envelope.status, code: envelope.code, error: envelope.error });

  if (envelope.status === 'ok') {
    const headers: Record<string, string> = envelope.replayed ? { 'X-Idempotent-Replayed': 'true' } : {};
    return json(200, { status: 'ok', output: envelope.output, runId: envelope.runId ?? runId, ...(llmSource ? { llmSource } : {}) }, headers);
  }
  return outcomeResponse(envelope.status, envelope.code, envelope.error, envelope.output, envelope.runId ?? runId, false);
};
