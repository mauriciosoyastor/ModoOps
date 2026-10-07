import { describe, it, expect } from "vitest";
import { createEnvApiKeyValidator, createCompositeSuspensionChecker } from "./adapters.ts";

describe("adapters createEnvApiKeyValidator — fail-closed", () => {
  it("sin expected configurado => false (no fail-open)", async () => {
    const validate = createEnvApiKeyValidator({});
    expect(await validate("modoops_demo", "cualquier-key")).toBe(false);
    expect(await validate("modoops_demo", "")).toBe(false);
  });

  it("con expected => solo acepta la key exacta", async () => {
    const validate = createEnvApiKeyValidator({ MODOOPS_AGENT_API_KEY_DEMO: "secret-123" });
    expect(await validate("modoops_demo", "secret-123")).toBe(true);
    expect(await validate("modoops_demo", "bad")).toBe(false);
    expect(await validate("modoops_demo", "")).toBe(false);
  });

  it("fallback genérica y DEFAULT", async () => {
    const generic = createEnvApiKeyValidator({ MODOOPS_AGENT_API_KEY: "generic-1" });
    expect(await generic("modoops_otro", "generic-1")).toBe(true);
    expect(await generic("modoops_otro", "bad")).toBe(false);
    const def = createEnvApiKeyValidator({ MODOOPS_AGENT_API_KEY_DEFAULT: "dev-key" });
    expect(await def("modoops_otro", "dev-key")).toBe(true);
    expect(await def("modoops_otro", "bad")).toBe(false);
  });
});

describe("adapters createCompositeSuspensionChecker — env OR master", () => {
  const envOk = async () => ({ suspended: false, reason: null });
  const envBlocked = async () => ({ suspended: true, reason: "Tenant suspendido — regularizá abono" });
  const gateOk = async () => ({ http: 200 as const });
  const gateBlocked = async () => ({ http: 403 as const, code: "tenant_suspended" as const, message: "mora" });

  it("bloquea si env bloquea aunque master diga ok", async () => {
    const check = createCompositeSuspensionChecker(envBlocked, gateOk);
    expect(await check("modoops_demo")).toMatchObject({ suspended: true });
  });

  it("bloquea si master bloquea aunque env diga ok", async () => {
    const check = createCompositeSuspensionChecker(envOk, gateBlocked);
    expect(await check("modoops_demo")).toMatchObject({ suspended: true });
  });

  it("pasa si ambos dicen ok", async () => {
    const check = createCompositeSuspensionChecker(envOk, gateOk);
    expect(await check("modoops_demo")).toEqual({ suspended: false, reason: null });
  });

  it("fail-open si master revienta: manda env", async () => {
    const boom = async () => { throw new Error("master caído"); };
    expect(await createCompositeSuspensionChecker(envOk, boom)("modoops_demo")).toEqual({ suspended: false, reason: null });
    expect(await createCompositeSuspensionChecker(envBlocked, boom)("modoops_demo")).toMatchObject({ suspended: true });
  });

  it("config rota (misconfigured) no se traga: propaga", async () => {
    const misconfigured = async () => { throw Object.assign(new Error("Falta ODOO_ADMIN_LOGIN"), { code: "misconfigured" }); };
    await expect(createCompositeSuspensionChecker(envOk, misconfigured)("modoops_demo")).rejects.toMatchObject({ code: "misconfigured" });
  });
});
