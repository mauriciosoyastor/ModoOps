import { defineMiddleware } from "astro:middleware";
import { BFF_COOKIE } from "./lib/bff/config.ts";
import { sessionStore } from "./lib/bff/session-store.ts";

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

  return next();
});
