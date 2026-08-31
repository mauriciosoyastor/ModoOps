import type { BackendClient } from "./backend-client.ts";
import { BffError } from "./errors.ts";
import type { HubPayload, LauncherPayload, SessionInfo } from "./types.ts";

type JsonRpcResponse<T> = { result?: T; error?: unknown };

export class OdooAdapter implements BackendClient {
  readonly #baseUrl: string;
  readonly #db: string;
  readonly #fetch: typeof fetch;
  readonly #timeoutMs: number;

  constructor(opts: { baseUrl: string; db: string; fetchImpl?: typeof fetch; timeoutMs?: number }) {
    this.#baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.#db = opts.db;
    this.#fetch = opts.fetchImpl ?? fetch;
    this.#timeoutMs = Math.max(1000, Number(opts.timeoutMs) || 15_000);
  }

  #signal(): AbortSignal {
    return AbortSignal.timeout(this.#timeoutMs);
  }

  #readSessionId(setCookie: string | null): string | null {
    if (!setCookie) return null;
    const m = setCookie.match(/session_id=([^;]+)/);
    return m ? m[1] : null;
  }

  async #post(path: string, body: unknown, odooSessionId?: string): Promise<Response> {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (odooSessionId) headers.cookie = `session_id=${odooSessionId}`;
    let res: Response;
    try {
      res = await this.#fetch(`${this.#baseUrl}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: this.#signal(),
      });
    } catch (e: unknown) {
      const name = (e as { name?: string })?.name || "";
      if (name === "TimeoutError" || name === "AbortError") throw new BffError("odoo_unavailable", 503, "Timeout Odoo");
      throw new BffError("odoo_unavailable", 503, "No se pudo conectar con Odoo");
    }
    return res;
  }

  async #callKw<T>(sessionId: string, model: string, method: string, args: unknown[] = [], kwargs: Record<string, unknown> = {}): Promise<T> {
    const res = await this.#post(
      "/web/dataset/call_kw",
      { jsonrpc: "2.0", params: { model, method, args, kwargs } },
      sessionId
    );
    const payload = (await res.json()) as JsonRpcResponse<T>;
    if (payload.error !== undefined) {
      const err = payload.error as { data?: { message?: string; name?: string }; message?: string };
      const msg = err?.data?.message || err?.message || "Odoo error";
      if (/SessionExpired|session expired/i.test(msg)) throw new BffError("unauthorized", 401, "Sesión expirada");
      if (/AccessDenied/i.test(err?.data?.name || "")) throw new BffError("unauthorized", 401, "Sesión inválida");
      throw new BffError("action_failed", 502, msg);
    }
    return payload.result as T;
  }

  async login(login: string, password: string): Promise<{ sessionId: string; session: SessionInfo }> {
    const res = await this.#post("/web/session/authenticate", {
      jsonrpc: "2.0",
      params: { db: this.#db, login, password },
    });
    const payload = (await res.json()) as JsonRpcResponse<{ uid?: number; name?: string; username?: string }>;
    if (!payload.result?.uid) throw new BffError("bad_credentials", 401, "Credenciales incorrectas");
    const sid = this.#readSessionId(res.headers.get("set-cookie"));
    if (!sid) throw new BffError("odoo_unavailable", 503, "Odoo no devolvió session_id");
    return { sessionId: sid, session: { uid: payload.result.uid, name: payload.result.name ?? "", login: payload.result.username ?? login } };
  }

  async logout(odooSessionId: string): Promise<void> {
    try {
      await this.#post("/web/session/destroy", { jsonrpc: "2.0", params: {} }, odooSessionId);
    } catch { /* best effort */ }
  }

  async validateSession(odooSessionId: string): Promise<void> {
    const res = await this.#post("/web/session/get_session_info", { jsonrpc: "2.0", params: {} }, odooSessionId);
    const payload = (await res.json()) as JsonRpcResponse<{ uid?: number | false }>;
    if (!payload.result?.uid) throw new BffError("unauthorized", 401, "Sesión inválida");
  }

  getLauncher(odooSessionId: string): Promise<LauncherPayload> {
    return this.#callKw(odooSessionId, "mo.app.tile", "get_launcher_payload", []);
  }

  getHub(odooSessionId: string, app: string, section?: string): Promise<HubPayload> {
    return this.#callKw(odooSessionId, "mo.hub.card", "get_hub_payload", [app, section ?? "summary"]);
  }

  async getAgentTools(odooSessionId: string): Promise<{ name: string; label: string; input_schema: unknown; groups_required: string[]; module_required: string | null }[]> {
    const rows = await this.#callKw<Record<string, unknown>[]>(odooSessionId, "modoops.agent.tool", "search_read", [[["active","=",true]], ["name","label","input_schema","groups_id","module_required","kind"]]);
    // Collect group ids for xml-id lookup
    const groupIds: number[] = [];
    for (const r of rows) {
      const g = r.groups_id as number[] | number | false | null;
      if (Array.isArray(g) && g[0]) groupIds.push(Number(g[0]));
      else if (typeof g === "number" && g) groupIds.push(g);
    }
    const groupMap = new Map<number, string>();
    if (groupIds.length) {
      const dataRows = await this.#callKw<Record<string, unknown>[]>(odooSessionId, "ir.model.data", "search_read", [[["model","=","res.groups"],["res_id","in",groupIds]], ["res_id","module","name"]]);
      for (const d of dataRows) {
        const rid = Number(d.res_id);
        const xml = `${d.module}.${d.name}`;
        if (rid) groupMap.set(rid, xml);
      }
    }
    return rows.map((r) => {
      let schema: unknown = {};
      try { schema = JSON.parse(String(r.input_schema || "{}")); } catch { schema = {}; }
      const g = r.groups_id as number[] | number | false | null;
      let gid: number | null = null;
      if (Array.isArray(g) && g[0]) gid = Number(g[0]);
      else if (typeof g === "number" && g) gid = Number(g);
      const groupsRequired: string[] = gid && groupMap.get(gid) ? [groupMap.get(gid)!] : [];
      return {
        name: String(r.name),
        label: String(r.label),
        input_schema: schema,
        groups_required: groupsRequired,
        module_required: r.module_required ? String(r.module_required) : null,
      };
    });
  }

  async getTenants(odooSessionId: string): Promise<import("./backend-client.ts").TenantRow[]> {
    return this.#callKw(odooSessionId, "modoops.tenant", "search_read", [
      [],
      ["id", "name", "db_name", "slug", "vertical", "state", "abono_due_date", "suspend_grace_until", "modules_installed", "modules_installed_count"],
    ], { order: "name asc" });
  }

  async getTenantBySlug(odooSessionId: string, slug: string): Promise<import("./backend-client.ts").TenantRow | null> {
    const rows = await this.#callKw<import("./backend-client.ts").TenantRow[]>(
      odooSessionId,
      "modoops.tenant",
      "search_read",
      [[["slug", "=", slug]], ["id", "name", "db_name", "slug", "vertical", "state", "abono_due_date", "suspend_grace_until", "modules_installed", "modules_installed_count"]],
      { limit: 1 }
    );
    return rows[0] ?? null;
  }

  async createTenant(odooSessionId: string, vals: { name: string; slug?: string; vertical?: string }): Promise<{ id: number }> {
    const name = String(vals.name || "").trim();
    if (!name) throw new BffError("validation_error", 400, "Nombre requerido");
    const payload: Record<string, unknown> = { name, vertical: vals.vertical || "retail" };
    if (vals.slug) payload.slug = vals.slug;
    const id = await this.#callKw<number>(odooSessionId, "modoops.tenant", "create", [payload]);
    return { id: Number(id) };
  }

  async installTenantModules(
    odooSessionId: string,
    tenantId: number,
    vals: { modules: string[]; action?: "install" | "remove"; notes?: string }
  ): Promise<{ preview_command: string; modules_installed: string | false }> {
    const modules = (vals.modules || []).map((m) => String(m).trim()).filter(Boolean);
    if (!modules.length) throw new BffError("validation_error", 400, "Seleccioná al menos un módulo");
    const action = vals.action === "remove" ? "remove" : "install";
    // 1) create wizard + line_ids batch (kanban cards)
    const lineCommands: unknown[] = modules.map((mk) => [0, 0, { module_key: mk }]);
    const wizardId = await this.#callKw<number>(odooSessionId, "modoops.tenant.install.wizard", "create", [
      { tenant_id: tenantId, action, notes: vals.notes || "", line_ids: lineCommands },
    ]);
    // 2) fetch preview before confirm for audit response
    const previewRows = await this.#callKw<Record<string, unknown>[]>(
      odooSessionId, "modoops.tenant.install.wizard", "search_read", [[[ "id", "=", wizardId ]], ["preview_command"]]
    );
    const preview = String(previewRows[0]?.preview_command || "");
    // 3) confirm (writes modules_installed + _log)
    try {
      await this.#callKw(odooSessionId, "modoops.tenant.install.wizard", "action_confirm", [[wizardId]]);
    } catch (e) {
      // surface Odoo UserError verbatim (validation duplicate/not-installed)
      if (e instanceof BffError) throw e;
      throw e;
    }
    const tenantRows = await this.#callKw<Record<string, unknown>[]>(
      odooSessionId, "modoops.tenant", "search_read", [[[ "id", "=", tenantId ]], ["modules_installed"]]
    );
    return { preview_command: preview, modules_installed: (tenantRows[0]?.modules_installed as string | false) ?? false };
  }
}
