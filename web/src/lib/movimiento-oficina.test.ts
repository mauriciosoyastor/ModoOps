import { describe, expect, it } from "vitest";
import { desplazamientoDe, revelarDatosAntesDe } from "./movimiento-oficina";

describe("movimiento de la oficina", () => {
  it("el hilo del borrador se desplaza al instante", () => {
    expect(desplazamientoDe("hilo", false)).toBe("auto");
  });

  it("una zona se desplaza suave cuando hay movimiento", () => {
    expect(desplazamientoDe("zona", false)).toBe("smooth");
  });

  it("el nombre faltante se desplaza suave cuando hay movimiento", () => {
    expect(desplazamientoDe("nombre", false)).toBe("smooth");
  });

  it("con menos movimiento todo salto es instantáneo", () => {
    expect(desplazamientoDe("hilo", true)).toBe("auto");
    expect(desplazamientoDe("zona", true)).toBe("auto");
    expect(desplazamientoDe("nombre", true)).toBe("auto");
  });

  it("el nombre faltante abre los datos antes de saltar", () => {
    expect(revelarDatosAntesDe("nombre")).toBe(true);
  });

  it("el hilo y la zona no abren los datos", () => {
    expect(revelarDatosAntesDe("hilo")).toBe(false);
    expect(revelarDatosAntesDe("zona")).toBe(false);
  });
});
