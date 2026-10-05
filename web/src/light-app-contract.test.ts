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

  it('el grupo de teléfono y baja no arrastra una clase sin estilo', () => {
    const text = read('pages/admin/leads.astro');
    expect(text).not.toContain('filters__extra');
    expect(text).toContain('aria-label="Teléfono y baja"');
  });

  it('Nuevo y Contactado activos usan relleno sólido que pasa AA', () => {
    const text = read('pages/admin/leads.astro');
    expect(text).toContain("filters.estado === 'nuevo' && 'mo-pill--ok'");
    expect(text).toContain("filters.estado === 'contactado' && 'mo-pill--accent'");
    expect(text).not.toContain('--mo-ok-soft');
    expect(text).not.toContain('--mo-accent-soft');
    expect(text).toContain('color-mix(in srgb, var(--mo-ok) 85%, var(--mo-hero))');
    expect(text).toContain('color-mix(in srgb, var(--mo-accent) 65%, var(--mo-hero))');
    expect(text).toContain('color: var(--mo-on-hero)');
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

  it('el chrome del shell muestra la sesión del puesto y no el comercio', () => {
    const text = read('pages/tenant/[slug]/app.astro');
    const header = text.slice(text.indexOf('<header'), text.indexOf('</header>'));
    expect(header).toContain('data-bloquear');
    expect(header).toContain('puesto.aviso');
    expect(header).toContain('data-logout');
    expect(header).not.toContain('tenant?.name');
    expect(header).not.toContain('tenant.state');
    expect(header).not.toContain('puesto.caja');
    expect(header).not.toContain('app-bar__caja');
    expect(text).toContain('id="puesto-candado"');
    expect(text).toContain('aria-label="Desbloquear puesto"');
    expect(text).toContain('sesionDelPuesto({ persona: userName })');
    expect(text).not.toMatch(/sesionDelPuesto\(\{[^}]*caja/);
  });

  it('la pastilla de la pantalla actual usa el relleno hero', () => {
    const text = read('pages/tenant/[slug]/app.astro');
    const pill = text.slice(text.indexOf(".app-link[aria-current='page']"));
    expect(pill.slice(0, 280)).toContain('background: var(--mo-hero)');
    expect(pill.slice(0, 280)).toContain('color: var(--mo-on-hero)');
    expect(text).toContain('aria-label="Módulos"');
  });

  it('el Shell abre el Inicio en disposición Captura y confirma el cierre', () => {
    const text = read('pages/tenant/[slug]/app.astro');
    const mosaico = read('components/inicio/InicioMosaico.astro');
    expect(text).toContain('<InicioMosaico inicio={inicio} plano color captura');
    expect(text).toContain("sessionCloseCopy('shell'");
    expect(mosaico).toContain('class="capsulas"');
  });
});
