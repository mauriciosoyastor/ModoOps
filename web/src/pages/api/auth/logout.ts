import type { APIRoute } from "astro";
import { getBackend } from "../../../lib/bff/get-backend.ts";
import { invalidateBffSession, json, requireOdooSession } from "../../../lib/bff/http.ts";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const { odooSessionId } = requireOdooSession(cookies);
    await getBackend().logout(odooSessionId);
  } catch { /* no session → still clear */ }
  invalidateBffSession(cookies);
  return json({ ok: true });
};
