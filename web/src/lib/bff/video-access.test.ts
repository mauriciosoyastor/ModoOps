import { describe, it, expect } from "vitest";
import { getVideoAccessUrl } from "./config.ts";
import { resolveVideoAccess } from "./video-access.ts";

describe("Video-IA S1 — config", () => {
  it("sin env devuelve undefined (falla cerrada aguas abajo)", () => {
    expect(getVideoAccessUrl({})).toBeUndefined();
  });

  it("lee VIDEO_ACCESS_URL del env", () => {
    expect(getVideoAccessUrl({ VIDEO_ACCESS_URL: "https://video.stub/nuevo" })).toBe("https://video.stub/nuevo");
  });
});

describe("Video-IA S1 — resolveVideoAccess", () => {
  it("sin sesión → 401 unauthorized", () => {
    const res = resolveVideoAccess({ odooSessionId: undefined, env: {} });
    expect(res.http).toBe(401);
    expect(res.code).toBe("unauthorized");
  });

  it("con sesión pero sin URL → 503 action_failed (nunca placeholder silencioso)", () => {
    const res = resolveVideoAccess({ odooSessionId: "sid-123", env: {} });
    expect(res.http).toBe(503);
    expect(res.code).toBe("action_failed");
  });

  it("con sesión y URL → 200 link-externo con target _blank", () => {
    const res = resolveVideoAccess({ odooSessionId: "sid-123", env: { VIDEO_ACCESS_URL: "https://video.stub/nuevo" } });
    expect(res.http).toBe(200);
    expect(res.body).toEqual({ mode: "link-externo", url: "https://video.stub/nuevo", target: "_blank" });
  });
});
