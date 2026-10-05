export type CajaDelPuesto = "Caja 1";

export type SesionPuesto = {
  persona: string;
  caja: CajaDelPuesto;
  bloquear: "Bloquear puesto";
  desbloquear: "Desbloquear puesto";
  aviso: string;
};

export function sesionDelPuesto(input: { persona: string }): SesionPuesto {
  const persona = input.persona.trim();
  return {
    persona,
    caja: "Caja 1",
    bloquear: "Bloquear puesto",
    desbloquear: "Desbloquear puesto",
    aviso: persona
      ? `Puesto bloqueado. La sesión de ${persona} sigue abierta.`
      : "Puesto bloqueado. La sesión sigue abierta.",
  };
}
