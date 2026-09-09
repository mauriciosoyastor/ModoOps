import { describe, expect, it, vi } from "vitest";
import {
  SignedCookieSessionStore,
  sealSession,
  unsealSession,
  resetSessionStoreCache,
  getSessionStore,
  type SessionEntry,
} from "./session-store.ts";
import { resolveStoreKind } from "./config.ts";

const SECRET = "test-secret-32-bytes-minimo-xxxx";
const OTRO_SECRET = "otro-secreto-distinto-0000000000";

function entrada(): SessionEntry {
  return {
    odooSessionId: "odoo-sid-1",
    session: { uid: 2, name: "Administrator", login: "admin" },
    expiresAt: Date.now() + 3600_000,
    db: "modoops_servigas",
    slug: "servigas",
  };
}

describe("seal/unseal", () => {
  it("roundtrip con tenant-bound", () => {
    const original = entrada();
    const token = sealSession(original, SECRET);
    expect(token.startsWith("v1.")).toBe(true);
    expect(unsealSession(token, SECRET)).toEqual(original);
  });
  it("rechaza token adulterado", () => {
    const token = sealSession(entrada(), SECRET);
    const [v, payload] = token.split(".");
    const trucado = `${v}.${payload.slice(0, -2)}AA.${token.split(".")[2]}`;
    expect(unsealSession(trucado, SECRET)).toBeUndefined();
  });
  it("rechaza secreto distinto y forma rota", () => {
    const token = sealSession(entrada(), SECRET);
    expect(unsealSession(token, OTRO_SECRET)).toBeUndefined();
    expect(unsealSession("basura", SECRET)).toBeUndefined();
    expect(unsealSession("", SECRET)).toBeUndefined();
  });
});

describe("SignedCookieSessionStore", () => {
  it("create/get respeta expiración", () => {
    const store = new SignedCookieSessionStore({ secret: SECRET, ttlSeconds: 3600 });
    const sid = store.create("odoo-sid-1", { uid: 2, name: "Administrator", login: "admin" }, { db: "modoops_servigas", slug: "servigas" });
    const entry = store.get(sid);
    expect(entry?.slug).toBe("servigas");
    expect(entry?.db).toBe("modoops_servigas");
  });
  it("expirado → undefined", () => {
    const store = new SignedCookieSessionStore({ secret: SECRET, ttlSeconds: 3600 });
    const vieja: SessionEntry = { ...entrada(), expiresAt: Date.now() - 1000 };
    expect(store.get(sealSession(vieja, SECRET))).toBeUndefined();
  });
  it("updateSession no soportado, destroy no-op", () => {
    const store = new SignedCookieSessionStore({ secret: SECRET });
    const sid = store.create("odoo-sid-1", { uid: 2, name: "Administrator", login: "admin" });
    expect(store.updateSession(sid, { uid: 2, name: "Administrator", login: "admin" })).toBe(false);
    store.destroy(sid);
    expect(store.get(sid)).toBeDefined();
  });
  it("sin secret revienta", () => {
    expect(() => new SignedCookieSessionStore({ secret: "" })).toThrow();
  });
});

describe("resolveStoreKind (G6)", () => {
  it("default cookie fuera de test", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      expect(resolveStoreKind({})).toBe("cookie");
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
  it("respeta file/memory explícitos", () => {
    expect(resolveStoreKind({ BFF_SESSION_STORE: "file" })).toBe("file");
    expect(resolveStoreKind({ BFF_SESSION_STORE: "MEMORY" })).toBe("memory");
    expect(resolveStoreKind({ BFF_SESSION_STORE: "cookie" })).toBe("cookie");
  });
  it("getSessionStore fabrica según kind (smoke, sin colgar cache)", () => {
    const spy = vi.spyOn(process, "cwd").mockReturnValue("/tmp");
    resetSessionStoreCache();
    expect(getSessionStore()).toBeDefined();
    spy.mockRestore();
    resetSessionStoreCache();
  });
});

