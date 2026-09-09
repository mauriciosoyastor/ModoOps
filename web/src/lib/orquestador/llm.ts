/** LLM free adapter — Ollama local con fallback mock puro
 *  Contrato: recibe mensaje natural + catálogo, devuelve {tool, input}
 *  Si Ollama no responde (sin modelo, red lenta, timeout) cae a mock determinístico sin romper BFF.
 *  Env: OLLAMA_HOST (default http://localhost:11434), OLLAMA_MODEL (default llama3.2:1b), OLLAMA_TIMEOUT_MS
 */
import { TOOL_CATALOG } from "./tool-catalog.ts";

export type LLMResult = { tool: string; input: Record<string, unknown>; source: "ollama" | "mock" };

const OLLAMA_HOST = (typeof process !== "undefined" ? (process.env.OLLAMA_HOST as string) : undefined)
  || (typeof import.meta !== "undefined" ? (import.meta as unknown as { env?: Record<string, string> }).env?.OLLAMA_HOST : undefined)
  || "http://localhost:11434";
const OLLAMA_MODEL = (typeof process !== "undefined" ? (process.env.OLLAMA_MODEL as string) : undefined)
  || (typeof import.meta !== "undefined" ? (import.meta as unknown as { env?: Record<string, string> }).env?.OLLAMA_MODEL : undefined)
  || "llama3.2:1b";
const TIMEOUT_MS = Number(
  (typeof process !== "undefined" ? (process.env.OLLAMA_TIMEOUT_MS as string) : undefined) || "4000"
);

function systemPrompt(): string {
  const tools = TOOL_CATALOG.map((t) => `- ${t.name}: ${t.label} input_schema=${JSON.stringify(t.input_schema)}`).join("\n");
  return `Eres el Orquestador ModoOps. Elige UNA tool del catálogo y devuelve SOLO JSON {"tool":"nombre","input":{...}} sin texto extra.
Catálogo:
${tools}
Reglas:
- Si menciona stock/producto/inventario y un número, usa stock.consulta {product_id: <entero>}
- Si menciona cobrar/cobro/OT/caja y monto, usa ot.cobro {work_order_id, amount, medium}
- Caso contrario usa echo {message: "<mensaje original>"}
- No inventes campos, respeta required.`;
}

function mockLLM(message: string): LLMResult {
  const lower = message.toLowerCase();
  // stock.consulta: busca "stock ... 42" o "producto 42"
  const stockMatch = lower.match(/(?:stock|producto|inventario).*?(\d{1,6})/);
  if (stockMatch) {
    const pid = Number(stockMatch[1]);
    if (Number.isInteger(pid) && pid > 0) return { tool: "stock.consulta", input: { product_id: pid }, source: "mock" };
  }
  // ot.cobro: busca "cobro" + monto + OT — amount = último número (monto), work_order_id = número tras OT
  if (lower.includes("cobro") || lower.includes("cobrar") || lower.includes("ot")) {
    const allNums = [...message.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) => m[1].replace(",", "."));
    const woMatch = lower.match(/(?:ot|orden).*?(\d{1,6})/);
    const work_order_id = woMatch ? Number(woMatch[1]) : (allNums.length ? Number(allNums[0]) : 1);
    // amount: último número si hay 2+, si no el único
    const amountStr = allNums.length >= 2 ? allNums[allNums.length - 1] : allNums[0];
    const amount = amountStr ? Number(amountStr) : 100;
    if (amount > 0 && work_order_id > 0) return { tool: "ot.cobro", input: { work_order_id, amount, medium: "cash" }, source: "mock" };
  }
  return { tool: "echo", input: { message }, source: "mock" };
}

export async function callLLM(message: string): Promise<LLMResult> {
  const trimmed = (message || "").trim();
  if (!trimmed) return { tool: "echo", input: { message: "" }, source: "mock" };

  // intento Ollama con timeout corto para no bloquear BFF
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${OLLAMA_HOST.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: trimmed },
        ],
        format: "json",
        options: { temperature: 0, num_predict: 128 },
      }),
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`ollama ${res.status}`);
    const data = (await res.json()) as { message?: { content?: string } };
    const content = data?.message?.content?.trim() || "";
    // espera JSON puro
    const parsed = JSON.parse(content) as { tool?: string; input?: Record<string, unknown> };
    const tool = String(parsed.tool || "").trim();
    const input = (parsed.input && typeof parsed.input === "object" ? parsed.input : {}) as Record<string, unknown>;
    if (!tool) throw new Error("sin tool");
    // valida que tool existe en catálogo, si no cae a mock
    if (!TOOL_CATALOG.some((t) => t.name === tool)) throw new Error(`tool invalida ${tool}`);
    return { tool, input, source: "ollama" };
  } catch {
    clearTimeout(timer);
    return mockLLM(trimmed);
  }
}

export function isMockResult(r: LLMResult): boolean {
  return r.source === "mock";
}
