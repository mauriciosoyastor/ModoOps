import { getVideoAccessUrl, type BffEnv } from "./config.ts";

export type VideoAccessResult = {
  http: number;
  code: "ok" | "unauthorized" | "action_failed";
  body?: { mode: "link-externo"; url: string; target: "_blank" };
  message?: string;
};

/** Lógica pura del acceso Video-IA (testeable sin Astro; patrón `decide`). */
export function resolveVideoAccess(args: { odooSessionId?: string; env?: BffEnv }): VideoAccessResult {
  if (!args.odooSessionId) return { http: 401, code: "unauthorized" };
  const url = getVideoAccessUrl(args.env);
  if (!url) return { http: 503, code: "action_failed", message: "Video-IA no configurado (VIDEO_ACCESS_URL)" };
  return { http: 200, code: "ok", body: { mode: "link-externo", url, target: "_blank" } };
}
