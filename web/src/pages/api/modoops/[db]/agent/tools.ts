import type { APIRoute } from 'astro';

export const prerender = false;

const CATALOG = [
  { name: 'echo', label: 'Echo', input_schema: { type: 'object', required: ['message'] }, groups_required: [], module_required: null },
  { name: 'stock.consulta', label: 'Stock consulta', input_schema: { type: 'object', required: ['product_id'] }, groups_required: ['stock.group_stock_user'], module_required: 'stock' },
  { name: 'ot.cobro', label: 'OT cobro', input_schema: { type: 'object', required: ['work_order_id', 'amount'] }, groups_required: ['base.group_user'], module_required: null },
];

function getApiKey(request: Request, url: URL): string | null {
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  const xkey = request.headers.get('x-api-key');
  if (xkey) return xkey.trim();
  const qp = url.searchParams.get('apiKey') ?? url.searchParams.get('api_key');
  if (qp) return qp.trim();
  return null;
}

async function hmacCompare(provided: string, stored: string): Promise<boolean> {
  const isHash = /^[a-f0-9]{64}$/i.test(stored);
  if (isHash) {
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(provided));
    const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    let diff = 0;
    for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ stored.charCodeAt(i);
    return diff === 0 && hex.length === stored.length;
  }
  if (provided.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ stored.charCodeAt(i);
  return diff === 0;
}

export const GET: APIRoute = async ({ params, request }) => {
  const db = params.db as string;
  if (!db || !db.startsWith('modoops_')) {
    return new Response(JSON.stringify({ status: 'error', code: 'invalid_db', error: 'db_name inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const slug = db.replace(/^modoops_/, '');
  const url = new URL(request.url);
  const apiKey = getApiKey(request, url);

  const env = (globalThis as unknown as { env?: Record<string, string> })?.env
    ?? (typeof process !== 'undefined' ? (process as unknown as { env?: Record<string, string> })?.env : undefined)
    ?? {};
  const expected = (env as Record<string, string>)[`MODOOPS_AGENT_API_KEY_${slug.toUpperCase()}`]
    ?? (env as Record<string, string>).MODOOPS_AGENT_API_KEY
    ?? (env as Record<string, string>).MODOOPS_AGENT_API_KEY_DEFAULT;
  if (expected) {
    if (!apiKey || !(await hmacCompare(apiKey, expected))) {
      return new Response(JSON.stringify({ status: 'error', code: 'unauthorized', error: 'apiKey inválida' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
  }
  const suspended = (env as Record<string, string>)[`MODOOPS_TENANT_SUSPENDED_${slug.toUpperCase()}`] === '1';
  if (suspended) {
    return new Response(JSON.stringify({ status: 'error', code: 'tenant_suspended', error: 'Tenant suspendido' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  // Filter by groups_id would check request user groups; stub returns all active catalog for now
  // In prod: _is_visible_for_user groups_id & user.group_ids + module_required installed
  return new Response(JSON.stringify({ tools: CATALOG }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
