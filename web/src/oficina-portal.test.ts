import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)));
const pagina = () => readFileSync(join(root, "pages/oficina.astro"), "utf8");

describe("portal del borrador", () => {
  it("la marca es intraducible y la nota de cotizar habla del Catálogo", () => {
    const text = pagina();
    expect(text).toContain('Enviar a <span translate="no">ModoOps</span>');
    expect(text).not.toContain("catálogo vivo de Odoo");
    expect(text).toContain("Cotizá tu selección contra el Catálogo (sin guardar nada).");
  });

  it("los campos se completan con teclado y dedo", () => {
    const text = pagina();
    const inputs = text.match(/<input\b[^>]*>/g) ?? [];
    const selects = text.match(/<select\b[^>]*>/g) ?? [];
    const areas = text.match(/<textarea\b[^>]*>/g) ?? [];
    expect(inputs.length).toBeGreaterThan(0);
    for (const tag of [...inputs, ...selects, ...areas]) {
      expect(tag, tag).toMatch(/\bname=/);
    }
    for (const tag of inputs) {
      if (tag.includes('type="number"')) expect(tag, tag).toContain('inputmode="numeric"');
      if (tag.includes('type="email"')) expect(tag, tag).toContain('spellcheck="false"');
    }
    for (const placeholder of text.matchAll(/placeholder="([^"]*)"/g)) {
      expect(placeholder[1].endsWith("…"), placeholder[1]).toBe(true);
    }
    expect(text).toMatch(/\.oficina-campo\s*\{[^}]*min-height:\s*44px/);
    expect(text).toMatch(/\.oficina-campo\s*\{[^}]*touch-action:\s*manipulation/);
  });

  it("el error queda junto al dato que falta", () => {
    const text = pagina();
    expect(text).toContain('id="error-nombre"');
    expect(text).toContain('data-error="nombre"');
    expect(text).toContain('aria-describedby="error-nombre"');
    expect(text).toContain('id="error-contacto"');
    expect(text).toContain('data-error="contacto"');
    expect(text).toContain('aria-describedby="error-contacto"');
  });

  it("WhatsApp no se tabula si el borrador no cierra y copiar anuncia", () => {
    const text = pagina();
    expect(text).toMatch(/<a data-whatsapp\b[^>]*tabindex="-1"/);
    expect(text).not.toMatch(/<a data-whatsapp\b[^>]*\bhref=/);
    expect(text).toContain("setAttribute('tabindex', '-1')");
    expect(text).toContain("removeAttribute('href')");
    expect(text).toContain("Completá el nombre y un contacto antes de copiar.");
    expect(text).toMatch(/data-copiado[^>]*role="status"/);
  });

  it("el riel no reanuncia el JSON y los sectores tienen título", () => {
    const text = pagina();
    expect(text).toContain('<aside class="oficina-riel">');
    expect(text).not.toContain('<aside class="oficina-riel" aria-live="polite">');
    expect(text).toContain('<h2 class="oficina-h3">Sectores de tu borrador</h2>');
    expect(text).toMatch(/\.oficina-chip\s*\{[^}]*font-variant-numeric:\s*tabular-nums/);
    expect(text).toMatch(/\.oficina-titulo\s*\{[^}]*text-wrap:\s*balance/);
    expect(text).toContain("scroll-padding-top:");
  });
});
