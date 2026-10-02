import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Contrato light-app papel (#215): superficies producto CP + Shell
 * consumen tokens/layout papel, no el chrome dark de marketing.
 */
const root = join(dirname(fileURLToPath(import.meta.url)));
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

describe('contrato light-app papel (#215)', () => {
  it('admin/tenants usa LightAppLayout tema papel y veredicto', () => {
    const text = read('pages/admin/tenants.astro');
    expect(text).toContain('LightAppLayout');
    expect(text).toMatch(/theme=["']papel["']/);
    expect(text).toContain('mo-banner');
    expect(text).toContain('light-app-chrome');
    expect(text).not.toContain('mo-admin__eyebrow');
  });

  it('tenant shell usa LightAppLayout tema papel y FlowSheets', () => {
    const text = read('pages/tenant/[slug]/app.astro');
    expect(text).toContain('LightAppLayout');
    expect(text).toMatch(/theme=["']papel["']/);
    expect(text).toContain('data-sheet');
    expect(text).toContain('light-app-chrome');
    expect(text).not.toContain('mo-tenant__eyebrow');
  });

  it('LightAppLayout carga light-app y no monta chrome de marketing', () => {
    const text = read('layouts/LightAppLayout.astro');
    expect(text).toContain('light-app.css');
    expect(text).not.toContain('global.css');
    expect(text).not.toContain('FloatingWhatsApp');
    expect(text).not.toMatch(/import\s+SiteHeader/);
  });

  it('el Control Plane confirma el cierre, exporta la vista y opera la selección', () => {
    const text = read('pages/admin/tenants.astro');
    expect(text).toContain("sessionCloseCopy('control-plane')");
    expect(text).toContain('id="btn-export"');
    expect(text).toContain('id="bulk-bar"');
    expect(text).toContain('Más acciones para');
    expect(text).toContain('tenantsCsv');
    const logout = text.indexOf("querySelector('[data-logout]')");
    const confirm = text.indexOf("sessionCloseCopy('control-plane')");
    expect(logout).toBeGreaterThan(-1);
    expect(confirm).toBeGreaterThan(logout);
  });

  it('el Shell pone los atajos antes que el resumen y confirma el cierre', () => {
    const text = read('pages/tenant/[slug]/app.astro');
    const atajos = text.indexOf('aria-label="Atajos operativos"');
    const resumen = text.indexOf('aria-label="Resumen del día"');
    expect(atajos).toBeGreaterThan(-1);
    expect(resumen).toBeGreaterThan(atajos);
    expect(text).toContain('data-home-skeleton');
    expect(text).toContain('mo-skeleton--kpi');
    expect(text).toContain("sessionCloseCopy('shell'");
  });
});
