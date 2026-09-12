import { describe, it, expect } from "vitest";
import { POST } from "./chat.ts";

function req(body: unknown, ip = "9.9.9.9") {
  return {
    request: new Request("http://localhost/api/oficina/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    clientAddress: ip,
    locals: {},
  } as Parameters<typeof POST>[0];
}

describe("api/oficina/chat — ruta pública sin tenant", () => {
  it("responde Descubrimiento estático sin tocar LLM ni Odoo", async () => {
    const res = await POST(req({ message: "¿cuánto sale el descubrimiento?" }, "10.0.0.1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; reply: string; tool: string };
    expect(data.ok).toBe(true);
    expect(data.tool).toBe("precio.descubrimiento");
    expect(data.reply).toContain("$155");
    expect(data.reply).not.toContain("$800");
  });

  it("responde catálogo estático", async () => {
    const res = await POST(req({ message: "¿qué módulos ofrecen?" }, "10.0.0.2"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; tool: string };
    expect(data.ok).toBe(true);
    expect(data.tool).toBe("catalogo.info");
  });

  it("400 ante mensaje vacío o historial inválido", async () => {
    const v1 = await POST(req({ message: "   " }, "10.0.0.3"));
    expect(v1.status).toBe(400);
    const v2 = await POST(req({ message: "hola", history: [{ role: "x", text: "y" }] }, "10.0.0.4"));
    expect(v2.status).toBe(400);
  });

  it("429 tras 20 consultas/hora por IP", async () => {
    const ip = "10.0.0.5";
    for (let i = 0; i < 20; i++) {
      const r = await POST(req({ message: "¿qué módulos ofrecen?" }, ip));
      expect(r.status).toBe(200);
    }
    const bloqueada = await POST(req({ message: "¿qué módulos ofrecen?" }, ip));
    expect(bloqueada.status).toBe(429);
    const data = (await bloqueada.json()) as { error: { code: string } };
    expect(data.error.code).toBe("rate_limited");
  });

  it("el techo mensual cuenta también la rama estática (sin exentas)", async () => {
    process.env.MODOOPS_AGENT_QUOTA_DEFAULT = "3";
    try {
      const ip = "10.0.0.7";
      for (let i = 0; i < 3; i++) {
        const r = await POST(req({ message: "¿qué módulos ofrecen?" }, ip));
        expect(r.status).toBe(200);
      }
      const excedida = await POST(req({ message: "¿qué módulos ofrecen?" }, ip));
      expect(excedida.status).toBe(429);
      const data = (await excedida.json()) as { error: { code: string } };
      expect(data.error.code).toBe("quota_exceeded");
    } finally {
      delete process.env.MODOOPS_AGENT_QUOTA_DEFAULT;
    }
  });
});
