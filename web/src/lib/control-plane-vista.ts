/**
 * Vista operable del Control Plane y del cierre de sesión.
 * Costura pura: el CSV, la selección masiva y el texto del confirmado
 * no dependen del DOM. Spec #215, cortes locales.
 */

export type TenantVista = {
  id: number;
  name: string;
  slug: string;
  state: string;
  modules: number;
  due: string;
  saldoUsd: number | null;
};

export type BulkRow = {
  id: number;
  state: string;
};

export type SessionCloseCopy = {
  title: string;
  text: string;
  okLabel: string;
  cancelLabel: string;
};

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function tenantsCsv(rows: readonly TenantVista[]): string {
  const header = 'nombre,slug,estado,modulos,vto_abono,usd_mes';
  const lines = rows.map((row) =>
    [
      csvCell(row.name),
      csvCell(row.slug),
      csvCell(row.state),
      String(row.modules),
      csvCell(row.due),
      row.saldoUsd === null ? '' : String(row.saldoUsd),
    ].join(','),
  );
  return [header, ...lines].join('\n');
}

export function bulkSuspendIds(rows: readonly BulkRow[]): number[] {
  return rows.filter((row) => row.state !== 'suspendido').map((row) => row.id);
}

export function bulkReactivateIds(rows: readonly BulkRow[]): number[] {
  return rows.filter((row) => row.state === 'suspendido').map((row) => row.id);
}

export function selectionCountLabel(count: number): string {
  if (count === 1) return '1 seleccionado';
  return `${count} seleccionados`;
}

export function sessionCloseCopy(place: 'control-plane' | 'shell', tenantName = ''): SessionCloseCopy {
  if (place === 'shell') {
    const name = tenantName.trim() || 'este comercio';
    return {
      title: '¿Cerrar sesión?',
      text: `Vas a salir del Shell de ${name}. La caja abierta sigue en el servidor.`,
      okLabel: 'Cerrar sesión',
      cancelLabel: 'Seguir acá',
    };
  }
  return {
    title: '¿Cerrar sesión?',
    text: 'Vas a salir del Control Plane. Los tenants siguen como los dejaste.',
    okLabel: 'Cerrar sesión',
    cancelLabel: 'Seguir acá',
  };
}
