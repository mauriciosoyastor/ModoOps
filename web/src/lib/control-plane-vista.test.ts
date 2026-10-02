import { describe, expect, it } from 'vitest';
import {
  bulkReactivateIds,
  bulkSuspendIds,
  selectionCountLabel,
  sessionCloseCopy,
  tenantsCsv,
} from './control-plane-vista.ts';

const pintureria = {
  id: 1,
  name: 'Pinturería Centro',
  slug: 'pintureria_centro',
  state: 'activo',
  modules: 4,
  due: '2026-10-01',
  saldoUsd: 50,
};

describe('vista del Control Plane', () => {
  it('exporta el CSV de la vista filtrada con una fila conocida', () => {
    expect(tenantsCsv([pintureria])).toBe(
      'nombre,slug,estado,modulos,vto_abono,usd_mes\nPinturería Centro,pintureria_centro,activo,4,2026-10-01,50',
    );
  });

  it('entrecomilla un nombre que trae coma', () => {
    expect(
      tenantsCsv([
        {
          ...pintureria,
          name: 'Francis, Turri',
          slug: 'francisturri',
          state: 'moroso',
          modules: 2,
          due: '',
          saldoUsd: null,
        },
      ]),
    ).toBe(
      'nombre,slug,estado,modulos,vto_abono,usd_mes\n"Francis, Turri",francisturri,moroso,2,,',
    );
  });

  it('suspende activos y morosos, y reactiva solo suspendidos', () => {
    const rows = [
      { id: 1, state: 'activo' },
      { id: 2, state: 'suspendido' },
      { id: 3, state: 'moroso' },
    ];
    expect(bulkSuspendIds(rows)).toEqual([1, 3]);
    expect(bulkReactivateIds(rows)).toEqual([2]);
  });

  it('no arma una acción masiva si no hay selección', () => {
    expect(bulkSuspendIds([])).toEqual([]);
    expect(bulkReactivateIds([])).toEqual([]);
    expect(selectionCountLabel(0)).toBe('0 seleccionados');
    expect(selectionCountLabel(1)).toBe('1 seleccionado');
    expect(selectionCountLabel(2)).toBe('2 seleccionados');
  });

  it('pide confirmación distinta en Control Plane y en el Shell', () => {
    expect(sessionCloseCopy('control-plane')).toEqual({
      title: '¿Cerrar sesión?',
      text: 'Vas a salir del Control Plane. Los tenants siguen como los dejaste.',
      okLabel: 'Cerrar sesión',
      cancelLabel: 'Seguir acá',
    });
    expect(sessionCloseCopy('shell', 'Pinturería Centro')).toEqual({
      title: '¿Cerrar sesión?',
      text: 'Vas a salir del Shell de Pinturería Centro. La caja abierta sigue en el servidor.',
      okLabel: 'Cerrar sesión',
      cancelLabel: 'Seguir acá',
    });
  });
});
