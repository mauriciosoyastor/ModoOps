import { describe, it, expect, afterEach } from "vitest";
import { GET } from "./home.ts";
import { __setBackendForTests, resetBackendCache } from "../../../../lib/bff/get-backend.ts";
import type { BackendClient } from "../../../../lib/bff/backend-client.ts";

function ctx(url: string, locals: Record<string, unknown> = {}) {
  return {
    params: { slug: "demo" },
    url: new URL(url),
    locals: { odooSessionId: "s1", ...locals },
  } as unknown as Parameters<typeof GET>[0];
}

const stub = {
  getTenantBySlug: async () => ({ name: "Pinturería Centro" }),
} as unknown as BackendClient;

afterEach(() => {
  __setBackendForTests(undefined);
  resetBackendCache();
});

describe("api/tenant/[slug]/home — home hub MP", () => {
  it("sin sesión → 401", async () => {
    const res = await GET(ctx("http://localhost/api/tenant/demo/home", { odooSessionId: undefined }));
    expect(res.status).toBe(401);
  });

  it("con sesión → contrato home con ancla y ceros", async () => {
    __setBackendForTests(stub);
    const res = await GET(ctx("http://localhost/api/tenant/demo/home"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      ok: boolean;
      tenant: { slug: string; nombre: string };
      home: { tabs: { id: string }[]; tab: string; moneda: string; cajaHoy: number };
    };
    expect(data.ok).toBe(true);
    expect(data.tenant).toMatchObject({ slug: "demo", nombre: "Pinturería Centro" });
    expect(data.home.tabs.map((t) => t.id)).toEqual(["mostrador", "deposito", "compras", "fiscal_ar"]);
    expect(data.home).toMatchObject({ tab: "mostrador", moneda: "ARS", cajaHoy: 0 });
  });

  it("respeta modulos csv y tab; tab inválido → primero", async () => {
    __setBackendForTests(stub);
    const r1 = await GET(ctx("http://localhost/api/tenant/demo/home?modulos=mostrador,taller&tab=taller"));
    const d1 = (await r1.json()) as { home: { tab: string } };
    expect(d1.home.tab).toBe("taller");
    const r2 = await GET(ctx("http://localhost/api/tenant/demo/home?modulos=deposito&tab=mostrador"));
    const d2 = (await r2.json()) as { home: { tab: string } };
    expect(d2.home.tab).toBe("deposito");
  });

  it("módulo desconocido → 400", async () => {
    __setBackendForTests(stub);
    const res = await GET(ctx("http://localhost/api/tenant/demo/home?modulos=nave_espacial"));
    expect(res.status).toBe(400);
  });
});
