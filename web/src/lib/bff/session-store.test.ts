import { describe, it, expect } from "vitest";
import { MemorySessionStore } from "./session-store.ts";

describe("session-store multi-db (B1 acceso empleado)", () => {
  it("create sin opts guarda sesión master (sin db/slug, compat)", () => {
    const store = new MemorySessionStore({ ttlSeconds: 60 });
    const sid = store.create("odoo-sid", { uid: 2, name: "Admin", login: "admin" });
    const entry = store.get(sid);
    expect(entry?.odooSessionId).toBe("odoo-sid");
    expect(entry?.db).toBeUndefined();
    expect(entry?.slug).toBeUndefined();
  });

  it("create con {db, slug} guarda sesión tenant-bound", () => {
    const store = new MemorySessionStore({ ttlSeconds: 60 });
    const sid = store.create(
      "odoo-sid-tenant",
      { uid: 5, name: "Vendedor", login: "vendedor" },
      { db: "modoops_servigas", slug: "servigas" }
    );
    const entry = store.get(sid);
    expect(entry?.db).toBe("modoops_servigas");
    expect(entry?.slug).toBe("servigas");
  });

  it("updateSession conserva db/slug salvo reemplazo explícito", () => {
    const store = new MemorySessionStore({ ttlSeconds: 60 });
    const sid = store.create(
      "odoo-sid-tenant",
      { uid: 5, name: "Vendedor", login: "vendedor" },
      { db: "modoops_servigas", slug: "servigas" }
    );
    store.updateSession(sid, { uid: 5, name: "Vendedor", login: "vendedor" });
    expect(store.get(sid)?.db).toBe("modoops_servigas");
  });
});
