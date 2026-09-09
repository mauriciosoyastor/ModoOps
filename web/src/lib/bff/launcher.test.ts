import { describe, expect, it, vi } from "vitest";
import { loadTenantLauncher } from "./launcher.ts";
import { BffError } from "./errors.ts";

const TENANT = {
  id: 1,
  name: "Servigas",
  db_name: "modoops_servigas",
  slug: "servigas",
  vertical: "taller",
  state: "activo",
  abono_due_date: false,
  suspend_grace_until: false,
  modules_installed: false,
  modules_installed_count: 0,
  phone: false,
  situacion: false,
  contrato_count: 0,
  saldo_pendiente_usd: 0,
} as const;

describe("loadTenantLauncher (G8)", () => {
  it("metadata vía master + tiles vía DB tenant", async () => {
    const getTenantBySlugMaster = vi.fn(async () => ({ ...TENANT }));
    const getLauncherForDb = vi.fn(async () => ({ tiles: [{ id: 7, label: "Taller" }] }));
    const res = await loadTenantLauncher("servigas", "sess-tenant", {
      getTenantBySlugMaster,
      getLauncherForDb,
    });
    expect(getTenantBySlugMaster).toHaveBeenCalledWith("servigas");
    // la DB que resuelve tiles es la del tenant, nunca master
    expect(getLauncherForDb).toHaveBeenCalledWith("modoops_servigas", "sess-tenant");
    expect(res.tenant.slug).toBe("servigas");
    expect(res.tiles).toHaveLength(1);
  });

  it("tenant inexistente → not_found sin tocar la DB tenant", async () => {
    const getTenantBySlugMaster = vi.fn(async () => null);
    const getLauncherForDb = vi.fn(async () => ({ tiles: [] }));
    await expect(
      loadTenantLauncher("fantasma", "sess-tenant", { getTenantBySlugMaster, getLauncherForDb })
    ).rejects.toMatchObject({ code: "not_found" });
    expect(getLauncherForDb).not.toHaveBeenCalled();
  });

  it("DB tenant caída → odoo_unavailable sin fallback silencioso a master", async () => {
    const getTenantBySlugMaster = vi.fn(async () => ({ ...TENANT }));
    const getLauncherForDb = vi.fn(async () => {
      throw new BffError("odoo_unavailable", 503, "No se pudo conectar con Odoo");
    });
    await expect(
      loadTenantLauncher("servigas", "sess-tenant", { getTenantBySlugMaster, getLauncherForDb })
    ).rejects.toMatchObject({ code: "odoo_unavailable" });
    expect(getLauncherForDb).toHaveBeenCalledTimes(1);
  });
});
