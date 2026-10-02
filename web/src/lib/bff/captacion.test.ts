import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BffError } from "./errors.ts";
import { captacionAuditDetail, captacionLeadPayload, formatFechaCaptura, formatTelefono } from "./captacion.ts";
import { isProtectedPath } from "./guardia-rutas.ts";

const src = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("alta de Acceso Captación", () => {
  it("sin teléfono queda descartado y el log no lleva datos de la persona", () => {
    const payload = captacionLeadPayload({
      nombre: "Kiosco Norte",
      telefono: "   ",
      email: "ana@kiosco.test",
      categoria: "kiosco",
    });
    expect(payload.estado).toBe("descartado");
    expect(payload.telefono).toBeUndefined();
    expect(payload.email).toBe("ana@kiosco.test");
    expect(payload.fuente).toBe("captacion-manual");

    const detail = captacionAuditDetail(12);
    expect(detail).toBe("Alta captación lead id 12");
    expect(detail).not.toContain("Kiosco Norte");
    expect(detail).not.toContain("ana@kiosco.test");
  });

  it("con teléfono queda nuevo", () => {
    const payload = captacionLeadPayload({
      nombre: "Kiosco Norte",
      telefono: "3515550101",
    });
    expect(payload.estado).toBe("nuevo");
    expect(payload.telefono).toBe("3515550101");
  });

  it("exige nombre", () => {
    expect(() => captacionLeadPayload({ nombre: "  " })).toThrow(BffError);
  });

  it("muestra la fecha de captura en es-AR, sin correr el día", () => {
    const formatted = formatFechaCaptura("2026-03-15");
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/2026/);
    expect(formatted).not.toMatch(/14/);
    expect(formatFechaCaptura(false)).toBe("—");
  });

  it("separa el teléfono del Lead para que no se parta", () => {
    expect(formatTelefono("03547532008")).toBe("0354\u00A0753\u00A02008");
    expect(formatTelefono(false)).toBe("—");
    expect(formatTelefono("")).toBe("—");
  });
});

describe("puerta /captacion", () => {
  it("está protegida igual que /admin", () => {
    expect(isProtectedPath("/admin")).toBe(true);
    expect(isProtectedPath("/captacion")).toBe(true);
    expect(isProtectedPath("/api/captacion")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
    const middleware = readFileSync(join(src, "middleware.ts"), "utf8");
    expect(middleware).toContain('from "./lib/bff/guardia-rutas.ts"');
  });

  it("lista con filtros y sin acciones destructivas", () => {
    const page = readFileSync(join(src, "pages/captacion.astro"), "utf8");
    expect(page).toContain("regla S4");
    expect(page).toContain('name="sin_telefono"');
    expect(page).toContain('name="opt_out"');
    expect(page).toContain('action="/captacion"');
    expect(page).toContain("/api/captacion");
    expect(page).not.toContain("data-purge");
    expect(page).not.toContain("data-optout");
    expect(page).not.toContain("Purgar");
    expect(page).not.toMatch(/\bBaja\b/);
    expect(page).toContain("limit: null");
    expect(page).toContain("next.search");
    expect(page).toContain('id="alta-error"');
    expect(page).toContain("touch-action: manipulation");
    expect(page).not.toContain("#f59e0b");
    expect(page).toContain("formatFechaCaptura");
  });
});
