/** Puerta de suspensión del login tenant (B1/B4) — lógica pura, testeable sin Odoo.
 * Orden anti-oráculo: el caller valida credenciales primero; esta función solo decide por estado.
 * tenant null (inexistente) → 401 genérico, igual que credencial inválida: no filtra qué existe.
 */

export type TenantGateTenant = {
  state: string;
  abono_due_date: string | false;
};

export type TenantGateResult =
  | { http: 200 }
  | { http: 401; code: "unauthorized" }
  | { http: 403; code: "tenant_suspended"; message: string };

export function resolveTenantGate(tenant: TenantGateTenant | null): TenantGateResult {
  if (!tenant) return { http: 401, code: "unauthorized" };
  if (tenant.state === "activo") return { http: 200 };
  if (tenant.state === "baja") {
    return { http: 403, code: "tenant_suspended", message: "Cuenta dada de baja. Escribinos para reactivarla." };
  }
  const vto = typeof tenant.abono_due_date === "string" && tenant.abono_due_date ? tenant.abono_due_date : "desconocido";
  return {
    http: 403,
    code: "tenant_suspended",
    message: `Cuenta suspendida por mora del abono (vto ${vto}). Regularizá el pago para reactivar el acceso.`,
  };
}
