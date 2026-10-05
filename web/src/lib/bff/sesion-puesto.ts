export type SesionPuesto = {
  persona: string;
  caja: string;
  bloquear: "Bloquear puesto";
  desbloquear: "Desbloquear puesto";
  aviso: string;
};

export function sesionDelPuesto(input: { persona: string; caja: string }): SesionPuesto {
  const persona = input.persona.trim();
  return {
    persona,
    caja: input.caja,
    bloquear: "Bloquear puesto",
    desbloquear: "Desbloquear puesto",
    aviso: persona
      ? `Puesto bloqueado. La sesión de ${persona} sigue abierta.`
      : "Puesto bloqueado. La sesión sigue abierta.",
  };
}
