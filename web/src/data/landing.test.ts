import { describe, it, expect } from 'vitest';
import {
  hero,
  problem,
  solution,
  ejemplo,
  contraste,
  circuito,
  puenteOficina,
  descubrimiento,
  migracion,
  fiscal,
  audience,
  howWeWork,
  despues,
  crecer,
  garantia,
  faq,
} from './business';

/**
 * Guardia de glosario comerciante (mapa #160, tono #163):
 * el copy nuevo/editado de la landing no publica jerga prohibida,
 * precios internos ni la marca blanca del backend.
 */
const FORBIDDEN = [
  'Odoo',
  '$800',
  '$50 USD',
  '77.5',
  'POS',
  'ERP',
  'stock',
  'onboarding',
  'go-live',
  'hipercare',
  'SKU',
  'ETL',
  'CAE',
  'staging',
];

describe('guardia de copy comerciante', () => {
  const publicCopy = { hero, problem, solution, ejemplo, contraste, circuito, puenteOficina, descubrimiento, migracion, fiscal, audience, howWeWork, despues, crecer, garantia, faq };
  for (const [name, value] of Object.entries(publicCopy)) {
    it(`${name} no contiene términos prohibidos`, () => {
      const text = JSON.stringify(value);
      for (const term of FORBIDDEN) {
        expect(text, `${name} contiene "${term}"`).not.toContain(term);
      }
    });
  }

  it('ejemplo marca ficticio y trae 3 señales', () => {
    expect(ejemplo.fictitious).toMatch(/ejemplo/i);
    expect(ejemplo.signs.length).toBeGreaterThanOrEqual(3);
  });

  it('contraste trae pares hoy/con', () => {
    expect(contraste.rows.length).toBeGreaterThanOrEqual(3);
    for (const row of contraste.rows) {
      expect(row.hoy.length).toBeGreaterThan(0);
      expect(row.con.length).toBeGreaterThan(0);
    }
  });

  it('circuito trae 5 pasos', () => {
    expect(circuito.steps.length).toBe(5);
  });

  it('descubrimiento trae agenda de 3 días', () => {
    expect(descubrimiento.agenda.length).toBe(3);
  });

  it('faq trae 5 preguntas con respuesta', () => {
    expect(faq.items.length).toBe(5);
    for (const item of faq.items) {
      expect(item.q.length).toBeGreaterThan(0);
      expect(item.a.length).toBeGreaterThan(0);
    }
  });
});
