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
  it('admin/leads usa LightAppLayout tema papel', () => {
    const text = read('pages/admin/leads.astro');
    expect(text).toContain('LightAppLayout');
    expect(text).toMatch(/theme=["']papel["']/);
    expect(text).toContain('light-app-chrome');
    expect(text).toContain("sessionCloseCopy('control-plane')");
    expect(text).not.toContain('BaseLayout');
    expect(text).not.toContain('mo-admin');
  });

  it('el panel de Leads cierra el chrome del Control Plane', () => {
    const text = read('pages/admin/leads.astro');
    expect(text).toContain('formatFechaCaptura');
    expect(text).toContain('content-visibility: auto');
    expect(text).toContain('env(safe-area-inset-top)');
    expect(text).toContain('text-wrap: balance');
    expect(text).toContain('scroll-padding-top');
    expect(text).toContain('(hover: hover) and (pointer: fine)');
    expect(text).not.toContain('Opt-out');
    expect(text).not.toContain('opt-out');
    expect(text).not.toContain('JSON de la API');
    const acciones = text.indexOf('class="tools__view"');
    const filtros = text.indexOf('aria-label="Filtros de leads"');
    expect(acciones).toBeGreaterThan(-1);
    expect(filtros).toBeGreaterThan(acciones);
    expect(text).toContain('formatTelefono');
    expect(text).toContain('Purgando…');
    expect(text).toContain('Dando de baja…');
    expect(text).toContain('Reintentá la purga.');
    expect(text).toContain('Reintentá la baja.');
    expect(text).toContain('auditoría de la captación');
    expect(text).not.toContain('en el tenant');
    expect(text).not.toContain("|| 'Error'");
  });

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

  it('la landing usa solo el Acento ModoOps', () => {
    const path = read('components/sections/Path.astro');
    const puente = read('components/sections/PuenteOficina.astro');
    const header = read('components/ui/SiteHeader.astro');
    const globalCss = read('styles/global.css');
    expect(path).not.toContain('--color-star-warm');
    expect(path).toContain('var(--mo-accent)');
    expect(puente).not.toContain('--color-star-warm');
    expect(puente).toContain('var(--mo-accent)');
    expect(header).toContain('env(safe-area-inset-top)');
    expect(header).toContain('(hover: hover) and (pointer: fine)');
    expect(header).toMatch(/\.lp-header__nav a\s*\{[^}]*min-height:\s*44px/);
    expect(header).toMatch(/\.lp-header__brand\s*\{[^}]*min-height:\s*44px/);
    expect(globalCss).toMatch(/::selection\s*\{[^}]*--mo-accent/);
    expect(globalCss).not.toMatch(/::selection\s*\{[^}]*galaxy-blue/);
    expect(puente).not.toContain('po-beat');
    expect(header).not.toContain('lp-header__mark');
  });

  it('la barra de selección de Tenants conserva el cromado del Control Plane', () => {
    const css = read('styles/light-app.css');
    const bulk = css.slice(css.indexOf('.mo-bulk {'));
    expect(bulk.slice(0, 500)).toContain('background: var(--mo-card)');
    expect(bulk.slice(0, 500)).toContain('color: var(--mo-ink)');
    expect(css).toMatch(/@media \(hover: hover\) and \(pointer: fine\)\s*\{[^}]*\.mo-table tbody tr:hover/);
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
