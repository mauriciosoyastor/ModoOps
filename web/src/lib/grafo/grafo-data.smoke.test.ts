import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Smoke #217: artefacto committed de /grafo es cargable y referencialmente sano.
 */
const root = join(dirname(fileURLToPath(import.meta.url)));
const jsonPath = join(root, '../../../public/grafo-data.json');

describe('grafo-data smoke (#217)', () => {
  const data = JSON.parse(readFileSync(jsonPath, 'utf8')) as {
    nodes: { id: string }[];
    edges: { from: string; to: string }[];
    communities: unknown[];
    processes: unknown[];
    meta: { stats: { nodes: number; edges: number }; indexedAt?: string };
  };

  it('tiene nodos file-level y arrays de scope A', () => {
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);
    expect(Array.isArray(data.communities)).toBe(true);
    expect(Array.isArray(data.processes)).toBe(true);
    expect(data.nodes.length).toBeGreaterThan(0);
    expect(data.communities).toEqual([]);
    expect(data.processes).toEqual([]);
    expect(data.meta.stats.nodes).toBe(data.nodes.length);
  });

  it('toda arista referencia un nodo existente', () => {
    const ids = new Set(data.nodes.map((n) => n.id));
    for (const e of data.edges) {
      expect(ids.has(e.from)).toBe(true);
      expect(ids.has(e.to)).toBe(true);
    }
  });

  it('grafo.astro consume data.ts del Índice (no copy congelado sin motor)', () => {
    const page = readFileSync(join(root, '../../pages/grafo.astro'), 'utf8');
    expect(page).toContain('from "../lib/grafo/data"');
    expect(page).not.toMatch(/sin motor|snapshot congelado/i);
    expect(page).toContain('Índice (dev)');
    expect(page).toContain('translate="no"');
  });
});
