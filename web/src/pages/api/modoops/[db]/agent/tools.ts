import type { APIRoute } from 'astro';
import { OdooAdapter } from '../../../../../lib/bff/odoo-adapter.ts';
import { createEnvApiKeyValidator, createEnvSuspensionChecker, getEnv } from '../../../../../lib/orquestador/adapters.ts';
import { TOOL_CATALOG } from '../../../../../lib/orquestador/tool-catalog.ts';

export const prerender = false;
const CATALOG_FALLBACK = TOOL_CATALOG;

async function fetchToolsFromMaster(): Promise<typeof CATALOG_FALLBACK | null> {
  const baseUrl = (import.meta.env.ODOO_URL as string) || (process.env.ODOO_URL as string) || 'http://localhost:8070';
  const masterDb = 'modoops_master';
  try {
    const adapter = new OdooAdapter({ baseUrl, db: masterDb });
    const login = (import.meta.env.ODOO_ADMIN_LOGIN as string) || (process.env.ODOO_ADMIN_LOGIN as string) || 'admin';
    const password = (import.meta.env.ODOO_ADMIN_PASSWORD as string) || (process.env.ODOO_ADMIN_PASSWORD as string) || 'admin';
    const { sessionId } = await adapter.login(login, password);
    const tools = await adapter.getAgentTools(sessionId);
    await adapter.logout(sessionId).catch(()=>{});
    return tools as typeof CATALOG_FALLBACK;
  } catch {
    return null;
  }
}

function getApiKey(request: Request, url: URL): string | null {
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  const xkey = request.headers.get('x-api-key');
  if (xkey) return xkey.trim();
  const qp = url.searchParams.get('apiKey') ?? url.searchParams.get('api_key');
  if (qp) return qp.trim();
  return null;
}

export const GET: APIRoute = async ({ params, request, locals }) => {
  const db = params.db as string;
  if (!db || !db.startsWith('modoops_')) {
    return new Response(JSON.stringify({ status: 'error', code: 'invalid_db', error: 'db_name inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const slug = db.replace(/^modoops_/, '');
  const url = new URL(request.url);
  const apiKey = getApiKey(request, url);

  const env = getEnv(locals);
  // reuse same adapters as run.ts — single seam, no duplicación (locality)
  const validateApiKey = createEnvApiKeyValidator(env);
  const isSuspended = createEnvSuspensionChecker(env);

  // apiKey check via adapter (deep module)
  const valid = await validateApiKey(db, apiKey ?? "");
  // need to know if expected was configured: adapter returns true when no expected (dev mode) — check raw expected
  const expected = (env as Record<string, string>)[`MODOOPS_AGENT_API_KEY_${slug.toUpperCase()}`] ?? (env as Record<string, string>).MODOOPS_AGENT_API_KEY ?? (env as Record<string, string>).MODOOPS_AGENT_API_KEY_DEFAULT;
  if (expected) {
    if (!apiKey || !valid) {
      return new Response(JSON.stringify({ status: 'error', code: 'unauthorized', error: 'apiKey inválida' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
  }
  const susp = await isSuspended(db);
  if (susp.suspended) {
    return new Response(JSON.stringify({ status: 'error', code: 'tenant_suspended', error: 'Tenant suspendido' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const dbTools = await fetchToolsFromMaster();
  const tools = dbTools ?? CATALOG_FALLBACK;
  return new Response(JSON.stringify({ tools }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
