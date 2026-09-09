import { describe, expect, it } from "vitest";
import { describeJobState, shouldPollJob } from "./install-job.ts";

describe("describeJobState (G7)", () => {
  it("pendiente/en_proceso → mensajes en curso", () => {
    expect(describeJobState("pendiente")).toMatch(/encolado/i);
    expect(describeJobState("en_proceso")).toMatch(/instalando/i);
  });
  it("hecho/error → mensajes finales", () => {
    expect(describeJobState("hecho")).toMatch(/instalado/i);
    expect(describeJobState("error")).toMatch(/falló/i);
  });
  it("desconocido → genérico sin romper", () => {
    expect(describeJobState("raro")).toMatch(/estado/i);
  });
});

describe("shouldPollJob", () => {
  it("sigue en pendiente y en_proceso", () => {
    expect(shouldPollJob("pendiente")).toBe(true);
    expect(shouldPollJob("en_proceso")).toBe(true);
  });
  it("corta en hecho y error", () => {
    expect(shouldPollJob("hecho")).toBe(false);
    expect(shouldPollJob("error")).toBe(false);
  });
});
