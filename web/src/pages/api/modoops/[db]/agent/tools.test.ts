import { describe, it, expect } from "vitest";
import { GET } from "./tools.ts";

function req(db: string, opts: { apiKey?: string; env?: Record<string, string> } = {}) {
  const url = new URL(`http://localhost/api/modoops/${db}/agent/tools`);
  const headers: Record<string, string> = {};
  if (opts.apiKey !== undefined) headers["x-api-key"] = opts.apiKey;
  return {
    params: { db },
    request: new Request(url, { headers }),
    locals: { runtime: { env: opts.env ?? {} } },
  } as unknown as Parameters<typeof GET>[0];
}

describe("api/modoops/[db]/agent/tools — auth fail-closed", () => {
  it("db inválido => 400", async () => {
    const res = await GET(req("demo"));
    expect(res.status).toBe(400);
  });

  it("key errónea con expected => 401", async () => {
    const res = await GET(req("modoops_demo", { apiKey: "bad", env: { MODOOPS_AGENT_API_KEY_DEMO: "secret-123" } }));
    expect(res.status).toBe(401);
  });

  it("sin expected configurado => 401 (no fail-open)", async () => {
    const res = await GET(req("modoops_demo", { apiKey: "cualquier-key", env: {} }));
    expect(res.status).toBe(401);
  });

  it("suspendido por env => 403", async () => {
    const res = await GET(
      req("modoops_demo", {
        apiKey: "secret-123",
        env: { MODOOPS_AGENT_API_KEY_DEMO: "secret-123", MODOOPS_TENANT_SUSPENDED_DEMO: "1" },
      })
    );
    expect(res.status).toBe(403);
  });

  it("auth ok pero sin creds master => 500 misconfigured (sin default admin)", async () => {
    const res = await GET(
      req("modoops_demo", { apiKey: "secret-123", env: { MODOOPS_AGENT_API_KEY_DEMO: "secret-123" } })
    );
    expect(res.status).toBe(500);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("misconfigured");
  });

  it("auth ok + creds + Odoo caído => 200 fallback catálogo", async () => {
    const res = await GET(
      req("modoops_demo", {
        apiKey: "secret-123",
        env: { MODOOPS_AGENT_API_KEY_DEMO: "secret-123", ODOO_ADMIN_LOGIN: "admin", ODOO_ADMIN_PASSWORD: "x" },
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { tools: unknown[] };
    expect(Array.isArray(data.tools)).toBe(true);
  });
});
