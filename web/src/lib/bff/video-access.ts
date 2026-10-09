import { getVideoAccessUrl, type BffEnv } from "./config.ts";

export type VideoAccessResult =
  | { http: 200; code: "ok"; body: { mode: "link-externo"; url: string; target: "_blank" } }
  | { http: 401; code: "unauthorized" }
  | { http: 503; code: "action_failed"; message: string };

/** Lógica pura del acceso Video-IA (testeable sin Astro; patrón `decide`). */
export function resolveVideoAccess(args: { odooSessionId?: string; env?: BffEnv }): VideoAccessResult {
  if (!args.odooSessionId) return { http: 401, code: "unauthorized" };
  const url = getVideoAccessUrl(args.env);
  if (!url) return { http: 503, code: "action_failed", message: "Video-IA no configurado (VIDEO_ACCESS_URL)" };
  return { http: 200, code: "ok", body: { mode: "link-externo", url, target: "_blank" } };
}
