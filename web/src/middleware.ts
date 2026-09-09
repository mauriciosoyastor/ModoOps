import { defineMiddleware } from "astro:middleware";
import { BFF_COOKIE } from "./lib/bff/config.ts";
import { sessionStore } from "./lib/bff/session-store.ts";
import { getGateCache } from "./lib/bff/tenant-status.ts";
import { isValidTenantSlug } from "./lib/bff/tenant-slug.ts";

// Deep module seam único para Guardia Auth (locality: 7 guards → 1)
// Tapa chica: callers (pages/api) solo conocen locals.odooSessionId, no BffError ni sessionStore.

const PROTECTED_PAGE_PREFIXES = ["/admin", "/app", "/tenant", "/hub"];
const PROTECTED_API_PREFIXES = ["/api/admin", "/api/launcher", "/api/hub"];
const PUBLIC_PATHS = ["/login", "/", "/api/auth"];

function isProtectedPage(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    // /api/auth es público aunque matchee /api/admin? No, /api/auth no está en protected api
    if (pathname.startsWith("/api/auth")) return false;
  }
  if (PROTECTED_PAGE_PREFIXES.some((pre) => pathname === pre || pathname.startsWith(pre + "/"))) return true;
  if (PROTECTED_API_PREFIXES.some((pre) => pathname === pre || pathname.startsWith(pre + "/"))) return true;
  return false;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, locals, redirect, url } = context;
  const pathname = url.pathname;

  // T3 login-tenant (prototipo): la puerta del empleado es pública (el db valida adentro)
  const tenantLogin = /^\/tenant\/([^/]+)\/login\/?$/.exec(pathname);
  if (tenantLogin && isValidTenantSlug(tenantLogin[1])) {
    return next();
  }

  if (!isProtectedPage(pathname)) {
    return next();
  }

  const sid = cookies.get(BFF_COOKIE)?.value;
  if (!sid) {
    // API → 401 JSON, Page → redirect /login
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: { code: "unauthorized", message: "Tenés que iniciar sesión" } }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    return redirect("/login");
  }

  const entry = sessionStore.get(sid);
  if (!entry) {
    // limpia cookie inválida
    cookies.delete(BFF_COOKIE, { path: "/" });
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: { code: "unauthorized", message: "Sesión inválida" } }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    return redirect("/login");
  }

  // inyecta Contexto Tenant para pages/api — single seam, no requireOdooSession duplicado
  (locals as Record<string, unknown>).bffSid = sid;
  (locals as Record<string, unknown>).odooSessionId = entry.odooSessionId;
  (locals as Record<string, unknown>).session = entry.session;
  // T3 login-tenant (prototipo): db tenant-bound opcional; ausente = master
  if (entry.db) (locals as Record<string, unknown>).tenantDb = entry.db;
  if (entry.slug) (locals as Record<string, unknown>).tenantSlug = entry.slug;

  // Fix G3: re-valida suspensión por request (cache TTL corto). Solo frena
  // estados no-activo; master caído = fail-open (la sesión ya era válida).
  if (entry.slug) {
    const gate = await getGateCache().getGate(entry.slug);
    if (gate.http !== 200) {
      sessionStore.destroy(sid);
      cookies.delete(BFF_COOKIE, { path: "/" });
      if (pathname.startsWith("/api/")) {
        const message = gate.http === 403 ? gate.message : "Tenés que iniciar sesión";
        return new Response(JSON.stringify({ error: { code: "tenant_suspended", message } }), {
          status: gate.http,
          headers: { "content-type": "application/json" },
        });
      }
      return redirect(`/tenant/${entry.slug}/login?suspendido=1`);
    }
  }

  return next();
});
