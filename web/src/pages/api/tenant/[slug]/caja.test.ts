import { describe, it, expect, afterEach } from "vitest";
import { POST } from "./caja.ts";
import { BFF_COOKIE } from "../../../../lib/bff/config.ts";
import { sessionStore, type SessionEntry } from "../../../../lib/bff/session-store.ts";

const ORIG_GET = sessionStore.get.bind(sessionStore);

function ctx(opts: { sid?: string; entry?: SessionEntry; slug?: string; body?: unknown }) {
  if (opts.entry) sessionStore.get = () => opts.entry;
  return {
    params: { slug: opts.slug ?? "demo" },
    request: new Request("http://localhost/api/tenant/demo/caja", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(opts.body ?? { caja: 1, fondo: "1000" }),
    }),
    cookies: { get: (name: string) => (name === BFF_COOKIE && opts.sid ? { value: opts.sid } : undefined) },
  } as unknown as Parameters<typeof POST>[0];
}

const ENTRY: SessionEntry = {
  odooSessionId: "s1",
  session: { uid: 7, name: "Vendedor", login: "vendedor" },
  expiresAt: Date.now() + 3600_000,
  db: "modoops_demo",
  slug: "demo",
};

describe("api/tenant/[slug]/caja — guards sin Odoo", () => {
  afterEach(() => {
    sessionStore.get = ORIG_GET;
  });

  it("sin cookie => 401", async () => {
    const res = await POST(ctx({}));
    expect(res.status).toBe(401);
  });

  it("sid desconocido => 401", async () => {
    const res = await POST(ctx({ sid: "nope", body: { caja: 1, fondo: "1000" } }));
    expect(res.status).toBe(401);
  });

  it("JSON inválido => 400", async () => {
    sessionStore.get = () => ENTRY;
    const res = await POST({
      params: { slug: "demo" },
      request: new Request("http://localhost/api/tenant/demo/caja", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "no-json{",
      }),
      cookies: { get: (name: string) => (name === BFF_COOKIE ? { value: "s1" } : undefined) },
    } as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
  });

  it("slug inválido => 400", async () => {
    const res = await POST(ctx({ sid: "s1", entry: ENTRY, slug: "Demo!!" }));
    expect(res.status).toBe(400);
  });

  it("caja inexistente => 400", async () => {
    const res = await POST(ctx({ sid: "s1", entry: ENTRY, body: { caja: 3, fondo: "1000" } }));
    expect(res.status).toBe(400);
  });

  it("fondo inválido => 400", async () => {
    const res = await POST(ctx({ sid: "s1", entry: ENTRY, body: { caja: 1, fondo: "abc" } }));
    expect(res.status).toBe(400);
  });

  it("slug distinto al de la sesión => 403", async () => {
    const res = await POST(ctx({ sid: "s1", entry: ENTRY, slug: "otro" }));
    expect(res.status).toBe(403);
  });
});
