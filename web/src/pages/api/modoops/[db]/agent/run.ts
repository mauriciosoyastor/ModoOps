import type { APIRoute } from 'astro';

export const prerender = false;

// In-memory KV for rate-limit + idempotency (per-worker instance, fallback to Cloudflare KV if bound)
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

// Timing-safe compare using SHA256 hex if stored is hash, else plain
async function hmacCompare(provided: string, storedHashOrPlain: string): Promise<boolean> {
  // If stored looks like sha256 hex (64 hex chars), hash provided and compare
  const isHash = /^[a-f0-9]{64}$/i.test(storedHashOrPlain);
  if (isHash) {
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(provided));
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    // timing-safe
    let diff = 0;
    for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ storedHashOrPlain.charCodeAt(i);
    return diff === 0 && hex.length === storedHashOrPlain.length;
  }
  // plain compare (fallback, timing-safe length check)
  if (provided.length !== storedHashOrPlain.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ storedHashOrPlain.charCodeAt(i);
  return diff === 0;
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const db = params.db as string;
  // 1) Validar db
  if (!db || !db.startsWith('modoops_')) {
    return json(400, { status: 'error', code: 'invalid_db', error: 'db_name inválido' });
  }
  const slug = db.replace(/^modoops_/, '');
  if (!/^[a-z0-9_]+$/.test(slug)) {
    return json(400, { status: 'error', code: 'invalid_db', error: 'slug inválido' });
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(400, { status: 'error', code: 'invalid_json', error: 'JSON inválido' });
  }

  const { tool, input, requestId } = body as { tool?: string; input?: unknown; requestId?: string };
  const apiKey = getApiKey(request, body);

  // requestId obligatorio UUID v4
  if (!requestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return json(400, { status: 'error', code: 'missing_requestId', error: 'requestId requerido UUID v4' });
  }
  if (!tool || typeof tool !== 'string') {
    return json(400, { status: 'error', code: 'missing_tool', error: 'tool requerida' });
  }

  // 1) Validar apiKey
  // In prod: ir.config_parameter modoops.agent.api_key.<slug> hasheada sha256
  // Here we resolve from env: MODOOPS_AGENT_API_KEY_<slug> or MODOOPS_AGENT_API_KEY
  const env = (locals as Record<string, unknown> & { runtime?: { env?: Record<string, string> } })?.runtime?.env
    ?? (globalThis as unknown as { env?: Record<string, string> })?.env
    ?? (typeof process !== 'undefined' ? (process as unknown as { env?: Record<string, string> })?.env : undefined)
    ?? {};
  // Try per-tenant first, then global (Cloudflare Workers env is flat)
  const expected = (env as Record<string, string>)[`MODOOPS_AGENT_API_KEY_${slug.toUpperCase()}`]
    ?? (env as Record<string, string>).MODOOPS_AGENT_API_KEY
    ?? (env as Record<string, string>).MODOOPS_AGENT_API_KEY_DEFAULT;
  if (expected) {
    if (!apiKey || !(await hmacCompare(apiKey, expected))) {
      // 5) Audit before proxy — also audit failures (here console, in prod modoops.tenant.log)
      // await audit('agent.run', { db, tool, code: 'unauthorized' })
      return json(401, { status: 'error', code: 'unauthorized', error: 'apiKey inválida' });
    }
  } else if (!apiKey) {
    // If no expected configured, require apiKey presence anyway (fail closed in prod)
    // In dev echo mode allow missing key for smoke
  }

  // 2) Consultar modoops_master state/suspend_grace_until (prod: fetch ODOO_URL JSON-RPC)
  // Stub: if env MODOOPS_TENANT_SUSPENDED_<slug>=1 → 403
  const suspended = (env as Record<string, string>)[`MODOOPS_TENANT_SUSPENDED_${slug.toUpperCase()}`] === '1';
  if (suspended) {
    return json(403, { status: 'error', code: 'tenant_suspended', error: 'Tenant suspendido — regularizá abono', suspend_grace_until: null });
  }

  // 3) Rate-limit + Techo IA
  const now = Date.now();
  const tenantKey = `rl:${db}`;
  const toolKey = `rl:${db}:${tool}`;
  const tenantEntry = rateMap.get(tenantKey);
  if (tenantEntry && tenantEntry.reset > now) {
    if (tenantEntry.count >= 10) {
      const retry = Math.ceil((tenantEntry.reset - now) / 1000);
      return json(429, { status: 'error', code: 'rate_limited', error: 'rate limit Tenant 10/min', retryAfter: retry }, { 'Retry-After': String(retry) });
    }
    tenantEntry.count++;
  } else {
    rateMap.set(tenantKey, { count: 1, reset: now + 60_000 });
  }
  const toolEntry = rateMap.get(toolKey);
  if (toolEntry && toolEntry.reset > now) {
    if (toolEntry.count >= 30) {
      const retry = Math.ceil((toolEntry.reset - now) / 1000);
      return json(429, { status: 'error', code: 'rate_limited', error: 'rate limit Tool 30/min', retryAfter: retry }, { 'Retry-After': String(retry) });
    }
    toolEntry.count++;
  } else {
    rateMap.set(toolKey, { count: 1, reset: now + 60_000 });
  }
  // Loop detection: 5× same hash(tool+input) in 60s
  const inputHash = JSON.stringify(input ?? null);
  const loopKey = `loop:${db}:${tool}:${inputHash}`;
  const loopEntry = rateMap.get(loopKey);
  if (loopEntry && loopEntry.reset > now && loopEntry.count >= 5) {
    return json(429, { status: 'error', code: 'rate_limited', error: 'loop detectado 5× mismo input en 60s' });
  }
  if (loopEntry && loopEntry.reset > now) loopEntry.count++;
  else rateMap.set(loopKey, { count: 1, reset: now + 60_000 });

  // Techo IA 200/mes stub: count in-memory per month key (prod: SELECT COUNT(*) FROM modoops_tenant_log WHERE action='agent.run')
  const monthKey = `quota:${db}:${new Date().toISOString().slice(0, 7)}`;
  const quotaEntry = rateMap.get(monthKey);
  const quotaUsed = quotaEntry && quotaEntry.reset > now ? quotaEntry.count : 0;
  const quota = Number((env as Record<string, string>)[`MODOOPS_AGENT_QUOTA_${slug.toUpperCase()}`] ?? (env as Record<string, string>).MODOOPS_AGENT_QUOTA_DEFAULT ?? '200');
  if (quotaUsed >= quota) {
    const reset = new Date(); reset.setMonth(reset.getMonth() + 1, 1); reset.setHours(0, 0, 0, 0);
    return json(429, { status: 'error', code: 'quota_exceeded', error: 'Techo IA excedido', quota, used: quotaUsed, reset: reset.toISOString() });
  }

  // 4) Validar input_schema (prod: tool_schemas.validate_tool_input)
  // Minimal check: tool must be known catalog (echo/stock.consulta/ot.cobro)
  const CATALOG = ['echo', 'stock.consulta', 'ot.cobro'];
  if (!CATALOG.includes(tool)) {
    return json(422, { status: 'needs_tool', code: 'unknown_tool', error: `Tool '${tool}' no existe en Catálogo`, reason: 'unknown_tool' });
  }
  // stock.consulta requires product_id
  if (tool === 'stock.consulta') {
    const inp = input as Record<string, unknown> | undefined;
    if (!inp || !('product_id' in inp)) {
      return json(400, { status: 'error', code: 'invalid_input', error: "Falta campo requerido 'product_id'" });
    }
  }

  // 5) Audit before proxy (prod: INSERT modoops.tenant.log action='agent.run' detail[:500] + modoops.agent.run)
  // Here we increment quota after audit
  if (quotaEntry && quotaEntry.reset > now) quotaEntry.count++;
  else rateMap.set(monthKey, { count: 1, reset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime() });

  // 6) Proxy idempotente unique(tenant_db,tool,requestId) 90d
  const idemKey = `${db}:${tool}:${requestId}`;
  const existing = idempotentMap.get(idemKey);
  if (existing) {
    return json(200, { status: existing.status, output: existing.output, runId: existing.runId }, { 'X-Idempotent-Replayed': 'true' });
  }

  const runId = `${db}:${tool}:${requestId}`;
  // Stub execution: echo input or fiscal guard check would happen in Odoo wrapper
  // If tool is ot.cobro and fiscal not enabled env flag → needs_tool fiscal_not_enabled
  if (tool === 'ot.cobro' && (env as Record<string, string>).MODOOPS_FISCAL_ENABLED === '0') {
    const output = { reason: 'fiscal_not_enabled', draft: null };
    idempotentMap.set(idemKey, { runId, output, status: 'needs_tool' });
    return json(422, { status: 'needs_tool', code: 'fiscal_not_enabled', error: 'Fiscal no habilitado', output, runId });
  }

  const output = { echo: input, tenantDb: db, tool, runId };
  idempotentMap.set(idemKey, { runId, output, status: 'ok' });
  return json(200, { status: 'ok', output, runId });
};
