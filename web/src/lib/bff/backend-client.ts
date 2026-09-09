import type { HubPayload, LauncherPayload, SessionInfo } from "./types.ts";
import type { LeadFilters, LeadRow } from "./leads.ts";

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
  phone: string | false;
  situacion: string | false;
  contrato_count: number;
  saldo_pendiente_usd: number;
};

export type InstallResult = {
  preview_command: string;
  modules_installed: string | false;
  /** G7: job real en install; null = remove mock legacy */
  job_id: number | null;
  job_state: string;
};

export type InstallJobStatus = {
  id: number;
  tenant_id: number;
  module_keys: string;
  tech_modules: string | false;
  state: string;
  output: string | false;
};

export type ConfiguradorWizardVals = {
  vertical: string;
  modulos_tildados: string;
  sucursales: number;
  almacenes: number;
  cajas_pos: number;
  sku_count: number;
  anexo_fiscal_ref?: string;
};

export type ConfiguradorQuote = {
  lista_cerrada: { key: string; modoops: string }[];
  precio: { ancla: number; validez_dias: number; anticipo: number; credito: number; anticipo_neto: number; tarifa_hora_adicional: number; addons: string[] };
  propuesta: { comercial_md: string; validez: number };
  errors: string[];
  warnings: string[];
  hash: string;
};

export interface BackendClient {
  login(login: string, password: string): Promise<{ sessionId: string; session: SessionInfo }>;
  logout(odooSessionId: string): Promise<void>;
  validateSession(odooSessionId: string): Promise<void>;
  getLauncher(odooSessionId: string): Promise<LauncherPayload>;
  getHub(odooSessionId: string, app: string, section?: string): Promise<HubPayload>;
  getTenants(odooSessionId: string): Promise<TenantRow[]>;
  getTenantBySlug(odooSessionId: string, slug: string): Promise<TenantRow | null>;
  // T5 login-tenant (prototipo): audita intentos en modoops.tenant.log
  auditTenantLog(odooSessionId: string, tenantId: number, action: string, detail?: string): Promise<void>;
  createTenant(odooSessionId: string, vals: { name: string; slug?: string; vertical?: string }): Promise<{ id: number }>;
  installTenantModules(
    odooSessionId: string,
    tenantId: number,
    vals: { modules: string[]; action?: "install" | "remove"; notes?: string }
  ): Promise<InstallResult>;
  getInstallJob(odooSessionId: string, jobId: number): Promise<InstallJobStatus | null>;
  // G2 puente portal→Odoo: preview sin persistencia (wizard transient)
  quotePreview(odooSessionId: string, vals: ConfiguradorWizardVals): Promise<ConfiguradorQuote>;
  getLeads(odooSessionId: string, filters?: LeadFilters): Promise<LeadRow[]>;
  optOutLead(odooSessionId: string, leadId: number): Promise<{ ok: true }>;
  purgeLeads(odooSessionId: string): Promise<{ purged: number }>;
}
