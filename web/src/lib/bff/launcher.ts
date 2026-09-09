import type { BackendClient, TenantRow } from "./backend-client.ts";
import type { LauncherPayload } from "./types.ts";
import { BffError } from "./errors.ts";
import { getBackendForDb } from "./get-backend.ts";
import { withMasterSession } from "./tenant-status.ts";

export type LauncherDeps = {
  getTenantBySlugMaster: (slug: string) => Promise<TenantRow | null>;
  getLauncherForDb: (db: string, sessionId: string) => Promise<LauncherPayload>;
};

function defaultDeps(): LauncherDeps {
  return {
    getTenantBySlugMaster: (slug) =>
      withMasterSession((master, sessionId) => master.getTenantBySlug(sessionId, slug)),
    getLauncherForDb: (db, sessionId) => getBackendForDb(db).getLauncher(sessionId),
  };
}

/**
 * G8 launcher real — metadata vía master (sesión de servicio), tiles vía
 * DB del tenant (sesión del empleado). Sin fallback silencioso a master:
 * si la DB tenant no responde, el error `odoo_unavailable` sube tal cual
 * para mostrar estado explícito en vez de tiles ficticios.
 */
export async function loadTenantLauncher(
  slug: string,
  tenantSessionId: string,
  deps: LauncherDeps = defaultDeps()
): Promise<{ tenant: TenantRow; tiles: LauncherPayload["tiles"] }> {
  const tenant = await deps.getTenantBySlugMaster(slug);
  if (!tenant) throw new BffError("not_found", 404, `Tenant '${slug}' no existe en modoops_master`);
  const payload = await deps.getLauncherForDb(tenant.db_name, tenantSessionId);
  return { tenant, tiles: payload.tiles };
}

export type { BackendClient };
