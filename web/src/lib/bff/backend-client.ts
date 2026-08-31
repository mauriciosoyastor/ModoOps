import type { HubPayload, LauncherPayload, SessionInfo } from "./types.ts";

export type TenantRow = {
  id: number;
  name: string;
  db_name: string;
  slug: string;
  vertical: string;
  state: string;
  abono_due_date: string | false;
  suspend_grace_until: string | false;
  modules_installed: string | false;
  modules_installed_count: number;
};

export interface BackendClient {
  login(login: string, password: string): Promise<{ sessionId: string; session: SessionInfo }>;
  logout(odooSessionId: string): Promise<void>;
  validateSession(odooSessionId: string): Promise<void>;
  getLauncher(odooSessionId: string): Promise<LauncherPayload>;
  getHub(odooSessionId: string, app: string, section?: string): Promise<HubPayload>;
  getTenants(odooSessionId: string): Promise<TenantRow[]>;
  createTenant(odooSessionId: string, vals: { name: string; slug?: string; vertical?: string }): Promise<{ id: number }>;
}
