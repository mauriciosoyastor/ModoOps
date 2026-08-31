import type { APIRoute } from "astro";
import { getBackend } from "../../../lib/bff/get-backend.ts";
import { bffErrorResponse, json, setBffCookie } from "../../../lib/bff/http.ts";
import { sessionStore } from "../../../lib/bff/session-store.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
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
    const { sessionId, session } = await getBackend().login(login, password);
    const bffSid = sessionStore.create(sessionId, session);
    setBffCookie(cookies, bffSid);
    return json({ ok: true, session });
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
