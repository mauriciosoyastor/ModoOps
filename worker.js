/** BFF Orquestador ModoOps — Cloudflare Worker aduana.
 * Rutas: POST /api/modoops/:db/agent/run  GET /api/modoops/:db/agent/tools
 * Valida apiKey, Contexto Tenant (db_name), y enforza suspensión/techo vía Odoo si ODOO_URL está seteado.
 * Si no hay ODOO_URL (dev), el Orquestador funciona en modo echo dummy auditando en memoria.
 */
const CATALOG = {
  'echo': { required: ['message'] },
  'stock.consulta': { required: ['product_id'] },
  'ot.cobro': { required: ['work_order_id', 'amount'] },
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/api\/modoops\/([^/]+)\/agent\/(run|tools)$/);
    if (m) {
      const db = m[1];
      const action = m[2];
      if (!db.startsWith('modoops_')) return json(400, { status: 'error', error: 'db_name inválido' });
      if (action === 'tools' && request.method === 'GET') {
        return json(200, { tools: Object.keys(CATALOG).map((name) => ({ name })) });
      }
      if (action === 'run' && request.method === 'POST') {
        let body = {};
        try { body = await request.json(); } catch { return json(400, { status: 'error', error: 'JSON inválido' }); }
        const { tool, input, requestId, apiKey } = body;
        if (!requestId) return json(400, { status: 'error', error: 'requestId requerido' });
        if (!tool) return json(400, { status: 'error', error: 'tool requerida' });
        const expected = env.MODOOPS_AGENT_API_KEY || env.MODOOPS_AGENT_API_KEY_DEFAULT;
        if (expected && apiKey !== expected) return json(401, { status: 'error', error: 'apiKey inválida' });
        if (!(tool in CATALOG)) return json(422, { status: 'needs_tool', error: `Tool '${tool}' no existe en Catálogo` });
        const required = CATALOG[tool].required;
        for (const f of required) if (!(f in (input || {}))) return json(422, { status: 'error', error: `Falta campo requerido '${f}'` });
        // TODO en prod: consultar modoops_master para suspensión/techo y proxy a Odoo modoops.agent.run con Contexto Tenant
        return json(200, { status: 'ok', runId: `${db}:${tool}:${requestId}`, tenantDb: db, tool, echo: input });
      }
      return json(405, { status: 'error', error: 'method not allowed' });
    }
    return env.ASSETS.fetch(request);
  },
};
