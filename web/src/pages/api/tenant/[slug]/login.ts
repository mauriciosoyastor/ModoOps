import type { APIRoute } from "astro";
import { OdooAdapter } from "../../../../lib/bff/odoo-adapter.ts";
import { getTenantBackend } from "../../../../lib/bff/get-backend.ts";
import { bffErrorResponse, json, setBffCookie } from "../../../../lib/bff/http.ts";
import { sessionStore } from "../../../../lib/bff/session-store.ts";
import { resolveTenantGate } from "../../../../lib/bff/tenant-gate.ts";
import { isValidTenantSlug } from "../../../../lib/bff/tenant-slug.ts";
import { BFF_COOKIE } from "../../../../lib/bff/config.ts";

export const prerender = false;

// T3 login-tenant (prototipo) + T5 suspensión: acceso de empleado — POST {login,password}
// contra modoops_<slug>. El slug de la URL fija el tenant: nunca hay listado (T1).
// Orden anti-oráculo: credenciales primero (401 genérico), estado después (403 solo con credencial válida).

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const slug = String(params.slug || "").trim();
  if (!isValidTenantSlug(slug)) {
    return json({ error: { code: "validation_error", message: "Tenant inválido" } }, { status: 400 });
  }
  let body: { login?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: { code: "validation_error", message: "JSON inválido" } }, { status: 400 });
  }
  const login = String(body.login || "").trim();
  const password = String(body.password || "");
  if (!login || !password) {
    return json({ error: { code: "validation_error", message: "Usuario y contraseña requeridos" } }, { status: 400 });
  }
  try {
    const db = `modoops_${slug}`;
    // 1) credencial contra el tenant (falla = 401 genérico, sin distinguir db inexistente)
    const tenantBackend = getTenantBackend(slug);
    const { sessionId, session } = await tenantBackend.login(login, password);

    // 2) estado en master (Odoo-backed, no env): requiere sesión master de servicio
    const baseUrl = (import.meta.env.ODOO_URL as string) || (process.env.ODOO_URL as string) || "http://localhost:8070";
    const masterLogin = (import.meta.env.ODOO_ADMIN_LOGIN as string) || (process.env.ODOO_ADMIN_LOGIN as string) || "admin";
    const masterPassword = (import.meta.env.ODOO_ADMIN_PASSWORD as string) || (process.env.ODOO_ADMIN_PASSWORD as string) || "admin";
    const master = new OdooAdapter({ baseUrl, db: "modoops_master" });
    let masterSid = "";
    try {
      masterSid = (await master.login(masterLogin, masterPassword)).sessionId;
    } catch {
      await tenantBackend.logout(sessionId).catch(() => {});
      return json({ error: { code: "odoo_unavailable", message: "No se pudo verificar el estado del tenant" } }, { status: 503 });
    }
    try {
      const tenant = await master.getTenantBySlug(masterSid, slug);
      const gate = resolveTenantGate(
        tenant ? { state: tenant.state, abono_due_date: tenant.abono_due_date } : null
      );
      if (gate.http !== 200) {
        if (gate.http === 403) {
          // prototipo: selection sin valor login_* → se audita como "aviso" con prefijo (sin cambio de modelo)
          await master.auditTenantLog(masterSid, tenant!.id, "aviso", `login_bloqueado ${tenant!.state} — ${login}`).catch(() => {});
        }
        await tenantBackend.logout(sessionId).catch(() => {});
        if (gate.http === 401) {
          return json({ error: { code: "unauthorized", message: "Usuario o contraseña incorrectos" } }, { status: 401 });
        }
        return json({ error: { code: gate.code, message: gate.message } }, { status: 403 });
      }
    } finally {
      await master.logout(masterSid).catch(() => {});
    }

    // 3) reemplazo T1: una sesión por browser — invalida la anterior y sobrescribe la cookie
    const prevSid = cookies.get(BFF_COOKIE)?.value;
    if (prevSid) sessionStore.destroy(prevSid);
    const bffSid = sessionStore.create(sessionId, session, { db, slug });
    setBffCookie(cookies, bffSid);
    return json({ ok: true, slug, db, session });
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
