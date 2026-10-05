import { describe, expect, it } from "vitest";
import { sesionDelPuesto } from "./sesion-puesto.ts";

describe("Sesión del puesto", () => {
  it("una lectura deja bloquear, desbloquear y el aviso de la sesión abierta", () => {
    const sesion = sesionDelPuesto({ persona: "Lucía Gómez" });
    expect(sesion.persona).toBe("Lucía Gómez");
    expect(sesion.bloquear).toBe("Bloquear puesto");
    expect(sesion.desbloquear).toBe("Desbloquear puesto");
    expect(sesion.aviso).toBe("Puesto bloqueado. La sesión de Lucía Gómez sigue abierta.");
  });

  it("sin nombre el aviso no inventa una persona", () => {
    const sesion = sesionDelPuesto({ persona: "  " });
    expect(sesion.persona).toBe("");
    expect(sesion.aviso).toBe("Puesto bloqueado. La sesión sigue abierta.");
  });
});
