/** Presentador del job de instalación real G7 — puro, sin Odoo.
 *
 * El wizard encola (`pendiente`), el cron ejecuta (`en_proceso`) y cierra en
 * `hecho`/`error`. La UI polea mientras `shouldPollJob` sea true.
 */

export type InstallJobState = "pendiente" | "en_proceso" | "hecho" | "error" | string;

const COPY: Record<string, string> = {
  pendiente: "Encolado — el servidor lo instala en unos minutos.",
  en_proceso: "Instalando en la DB del tenant…",
  hecho: "Instalado en la DB del tenant.",
  error: "Falló la instalación — revisá el detalle.",
};

export function describeJobState(state: InstallJobState): string {
  return COPY[state] ?? `Estado: ${state}`;
}

export function shouldPollJob(state: InstallJobState): boolean {
  return state === "pendiente" || state === "en_proceso";
}
