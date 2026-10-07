import { describe, it, expect } from "vitest";
import { createEnvApiKeyValidator } from "./adapters.ts";

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
