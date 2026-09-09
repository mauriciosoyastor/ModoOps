import { describe, expect, it, vi } from "vitest";
import {
  auditGateBlock,
  createGateCache,
  getFreshGate,
  getMasterCredentials,
  resolveGateTtlMs,
  withMasterSession,
  DEFAULT_GATE_TTL_MS,
  type MasterApi,
  type TenantStateFetcher,
} from "./tenant-status.ts";

describe("resolveGateTtlMs", () => {
  it("usa default sin env", () => {
    expect(resolveGateTtlMs(undefined)).toBe(DEFAULT_GATE_TTL_MS);
  });
  it("rechaza valores absurdos", () => {
    expect(resolveGateTtlMs("100")).toBe(DEFAULT_GATE_TTL_MS);
    expect(resolveGateTtlMs("nope")).toBe(DEFAULT_GATE_TTL_MS);
  });
  it("acepta ms razonables", () => {
    expect(resolveGateTtlMs("60000")).toBe(60_000);
  });
});

describe("createGateCache", () => {
  it("activo → 200 y cachea dentro del TTL", async () => {
    const fetchState: TenantStateFetcher = vi.fn(async () => ({ state: "activo", abono_due_date: false }));
    let t = 1_000;
    const cache = createGateCache({ ttlMs: 45_000, now: () => t, fetchState });
    expect(await cache.getGate("servigas")).toEqual({ http: 200 });
    t += 10_000;
    expect(await cache.getGate("servigas")).toEqual({ http: 200 });
    expect(fetchState).toHaveBeenCalledTimes(1);
  });

  it("suspendido → 403 con mensaje", async () => {
    const cache = createGateCache({
      fetchState: async () => ({ state: "suspendido", abono_due_date: "2026-10-31" }),
    });
    const res = await cache.getGate("servigas");
    expect(res.http).toBe(403);
    if (res.http === 403) expect(res.code).toBe("tenant_suspended");
  });

  it("tenant inexistente → 401 anti-oráculo", async () => {
    const cache = createGateCache({ fetchState: async () => null });
    expect(await cache.getGate("fantasma")).toEqual({ http: 401, code: "unauthorized" });
  });

  it("expirado el TTL revalida", async () => {
    const fetchState: TenantStateFetcher = vi
      .fn<[], Promise<{ state: string; abono_due_date: false }>>()
      .mockResolvedValueOnce({ state: "activo", abono_due_date: false })
      .mockResolvedValueOnce({ state: "suspendido", abono_due_date: false });
    let t = 0;
    const cache = createGateCache({ ttlMs: 45_000, now: () => t, fetchState });
    expect((await cache.getGate("servigas")).http).toBe(200);
    t += 46_000;
    expect((await cache.getGate("servigas")).http).toBe(403);
    expect(fetchState).toHaveBeenCalledTimes(2);
  });

  it("master caído → fail-open 200 sin cachear el error", async () => {
    const fetchState: TenantStateFetcher = vi.fn(async () => {
      throw new Error("odoo down");
    });
    const cache = createGateCache({ fetchState });
    expect(await cache.getGate("servigas")).toEqual({ http: 200 });
    expect(await cache.getGate("servigas")).toEqual({ http: 200 });
    expect(fetchState).toHaveBeenCalledTimes(2);
  });

  it("config rota → fail-closed (no fail-open)", async () => {
    const { BffError } = await import("./errors.ts");
    const fetchState: TenantStateFetcher = vi.fn(async () => {
      throw new BffError("misconfigured", 500, "Falta ODOO_ADMIN_LOGIN/PASSWORD");
    });
    const cache = createGateCache({ fetchState });
    await expect(cache.getGate("servigas")).rejects.toThrow("Falta ODOO_ADMIN_LOGIN");
  });

  it("invalidate fuerza revalidación", async () => {
    const fetchState: TenantStateFetcher = vi.fn(async () => ({ state: "activo", abono_due_date: false }));
    const cache = createGateCache({ fetchState });
    await cache.getGate("servigas");
    cache.invalidate("servigas");
    await cache.getGate("servigas");
    expect(fetchState).toHaveBeenCalledTimes(2);
  });
});

describe("getMasterCredentials (G4)", () => {
  it("devuelve par completo", () => {
    expect(getMasterCredentials({ ODOO_ADMIN_LOGIN: "admin", ODOO_ADMIN_PASSWORD: "s3cr3t" })).toEqual({
      login: "admin",
      password: "s3cr3t",
    });
  });
  it("revienta sin default silencioso", () => {
    expect(() => getMasterCredentials({})).toThrow();
    expect(() => getMasterCredentials({ ODOO_ADMIN_LOGIN: "admin" })).toThrow();
    expect(() => getMasterCredentials({ ODOO_ADMIN_LOGIN: "  ", ODOO_ADMIN_PASSWORD: "x" })).toThrow();
  });
});

function masterFalso(tenant: { id: number; state: string } | null): MasterApi & { calls: string[] } {
  const calls: string[] = [];
  const api = {
    calls,
    async login() {
      calls.push("login");
      return { sessionId: "master-sid" };
    },
    async logout() {
      calls.push("logout");
    },
    async getTenantBySlug() {
      calls.push("getTenantBySlug");
      return tenant ? { ...tenant, abono_due_date: false as const } : null;
    },
    async auditTenantLog() {
      calls.push("auditTenantLog");
    },
    async createLead() {
      calls.push("createLead");
      return { id: 9 };
    },
  };
  return api;
}

describe("withMasterSession", () => {
  it("abre, corre y cierra", async () => {
    const master = masterFalso({ id: 1, state: "activo" });
    const out = await withMasterSession(
      async (m, sid) => ({ sid, tenant: await m.getTenantBySlug(sid, "x") }),
      { openMaster: async () => ({ master, sessionId: "s", close: async () => { master.calls.push("close"); } }) }
    );
    expect(out.tenant).toMatchObject({ id: 1, state: "activo" });
    expect(master.calls).toEqual(["getTenantBySlug", "close"]);
  });
});

describe("getFreshGate", () => {
  it("invalida antes de leer (estricto para login)", async () => {
    const fetchState: TenantStateFetcher = vi
      .fn<[], Promise<{ state: string; abono_due_date: false }>>()
      .mockResolvedValueOnce({ state: "activo", abono_due_date: false })
      .mockResolvedValueOnce({ state: "suspendido", abono_due_date: false });
    const cache = createGateCache({ ttlMs: 60_000, fetchState });
    expect((await getFreshGate("servigas", cache)).http).toBe(200);
    // aunque esté dentro del TTL, el login revalida
    expect((await getFreshGate("servigas", cache)).http).toBe(403);
    expect(fetchState).toHaveBeenCalledTimes(2);
  });
});

describe("auditGateBlock", () => {
  it("audita con sesión efímera y la cierra", async () => {
    const master = masterFalso({ id: 7, state: "suspendido" });
    await auditGateBlock("servigas", "admin", {
      openMaster: async () => ({ master, sessionId: "s", close: async () => { master.calls.push("close"); } }),
    });
    expect(master.calls).toEqual(["getTenantBySlug", "auditTenantLog", "close"]);
  });
  it("nunca revienta (best-effort)", async () => {
    await auditGateBlock("servigas", "admin", {
      openMaster: async () => {
        throw new Error("master down");
      },
    });
  });
});
