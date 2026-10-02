import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

describe("Inicio visible", () => {
  const mosaico = read("components/inicio/InicioMosaico.astro");
  const controlPlane = read("pages/admin/inicio.astro");
  const shell = read("pages/tenant/[slug]/app.astro");

  it("el mosaico se recorre con enlaces y el foco del cierre queda en el aviso", () => {
    expect(mosaico).toContain("<a ");
    expect(mosaico).toContain("min-height: 44px");
    expect(mosaico).toContain("touch-action: manipulation");
    expect(controlPlane).toContain('tabindex="-1"');
    expect(controlPlane).toContain("error.focus()");
    expect(shell).toContain("data-logout");
  });

  it("no nombra el estado Moroso ni anima el desenfoque", () => {
    for (const text of [mosaico, controlPlane, shell]) {
      expect(text).not.toContain("Moroso");
      expect(text).not.toContain("blur");
    }
    expect(mosaico).toContain("prefers-reduced-motion");
  });

  it("el cierre fallido está en voseo", () => {
    expect(controlPlane).toContain("Probá de nuevo");
  });

  it("Tenants no ofrece el estado Moroso", () => {
    const tenants = read("pages/admin/tenants.astro");
    expect(tenants).not.toContain("Moroso");
    expect(tenants).not.toContain("moroso");
  });
});
