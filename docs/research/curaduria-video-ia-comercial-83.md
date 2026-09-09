# Research #83 — Curaduría GitHub editor/generador video IA comercial (ModoOps)

Uso: videos comerciales para promocionar sistema de gestión (marca blanca, Odoo CE 19 oculto — CONTEXT.md). Control Plane `modoops_admin` en `modoops_master`, MVP sin editor vistas ni billing auto (ADR 0007).
Destino embed: Shell Astro BFF + Liquid Glass; Odoo solo como orquestador/adjunto, no UI nativa.

Fuentes primarias: GitHub repo/LICENSE/README, docs oficiales (remotion.dev, docs.comfy.org, wan.video), HF ModelScope. Secundarias marcadas (reviews 2026) solo para mantenimiento/costos.

## Tabla comparativa (7 repos)

| Repo | Licencia (fuente) | Mantenimiento 2026 | Self-host vs SaaS | API | Costo | Compat Astro / Odoo embed |
|---|---|---|---|---|---|---|
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) — video programático React + Studio timeline | Custom dual: Free ≤3 empleados (comercial ok) / Company requerida si 4+ ([LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md), [pricing](https://www.remotion.pro/license)) | 58k★, 35.9k commits, update Sep-2026, 386 contributors; CVE-2026-30120 (RCE <4.0.410) parcheado en 4.0.410 | Self-host Node + render Lambda/VPS; SaaS no oficial (plantillas) | NPM + `@remotion/player` + Lambda render + Studio | Código $0 (equipo ≤3); Company: Creators $25/seat, Automators $0.01/render $100/mo mín, Enterprise $500/mo+ | Astro: **excelente** — Player como isla React, MP4 pre-render; Odoo: link/iframe MP4, sin módulo nativo |
| [OpenCut-app/OpenCut](https://github.com/OpenCut-app/OpenCut) — CapCut open web/desktop/mobile | MIT ([LICENSE](https://github.com/OpenCut-app/OpenCut/blob/main/LICENSE)) | 88k★, 1.5k commits, creado jun-2025, rewrite Rust core en curso (contribuciones externas pausadas) | Self-host bun+docker o SaaS opencut.app; sponsor fal.ai para IA | Editor API + headless + MCP **prometidos en rewrite** (classic: web Next.js) | $0 + GPU/fal.ai si IA | Astro: **óptimo** (timeline React embebible); Odoo: iframe/static |
| [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) — fábrica shorts IA (topic→MP4) | MIT ([LICENSE](https://github.com/harry0703/MoneyPrinterTurbo/blob/main/LICENSE)) | 112k★ (ago-2026), release v1.3.4 (ago-2026), activo | Self-host Python local/Docker, GPU opcional; sin SaaS oficial | FastAPI (`/docs`) + Streamlit WebUI | $0 código + LLM + TTS + Pexels/Pixabay + compute/storage | Astro: bueno (POST API → MP4); Odoo: job externo + adjunto. **No es editor timeline** |
| [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) — grafo nodos difusión (img+video: Wan/LTX/Hunyuan/CogVideo/Mochi) | GPL-3.0 | ~112–116k★, v0.33.4+ (nodos Wan 3.0 ago-2026) | Self-host bare metal / Runpod / Vast.ai / Docker comunitario (sin imagen oficial); Cloud managed opcional. **Sin auth por defecto** ([self-hosting](https://docs.comfy.org/development/deploy/self-hosting)) | REST+WS `:8188` + SDKs/API-proxy | $0 + GPU (mín RTX 3060 12GB, recom 4090 24GB; cloud $0.5–2/h) | Astro: medio (cola + polling, pesado p/ VPS ModoOps); Odoo: controller dispara workflow |
| [Wan-Video/Wan2.1](https://github.com/Wan-Video/Wan2.1) — modelo T2V/I2V open weights (Alibaba) | Apache-2.0 código+pesos, output sin claim ([LICENSE.txt](https://github.com/Wan-Video/Wan2.1/blob/main/LICENSE.txt)) | 16.9k★, 53 commits, VBench #1 86.22% (early-2025, puede haber caído) | Self-host Python/diffusers/ComfyUI o hosted (fal/Replicate/ModelScope/Gradio) | generate.py + Gradio + nodos Comfy + APIs hosted | $0 local + GPU (1.3B: 8GB VRAM, 5s/480p ~4min en 4090; 14B: 24GB, ~90s/5s-720p) o $0.02–0.10/s hosted | Solo generador headless B-roll 1–10s, **sin timeline**; Astro/Odoo: batch |
| [KDE/kdenlive](https://github.com/KDE/kdenlive) — NLE desktop maduro | GPL-3.0 | 5.6k★, 24k commits, v26.08.0 ago-2026 (MLT 7.20) | Desktop Linux/Win/Mac/BSD, sin SaaS | Sin API (solo Python básico + `melt` CLI) | $0 | **Nulo embed** — edición manual → export MP4 → subir |
| [mifi/lossless-cut](https://github.com/mifi/lossless-cut) — corte lossless FFmpeg | GPL-2.0 | 43k★, v3.69.0, commit ~10 días | Desktop Electron/TS, sin SaaS | CLI limitada, sin API | $0 | Solo pre/post (recorte sin re-encode); sin embed |

Descartados: `FujiwaraChoki/MoneyPrinterV2` (AGPL-3.0, 31k★, foco spam-monetización + outreach scraped — riesgo copyleft y reputacional; preferir Turbo MIT), `olive-editor/olive` (GPL-3.0, alpha inestable, 9k★), `OpenShot` (GPL-3.0, 6.4k★, menos activo que Kdenlive), SaaS cerrados (Runway/Sora/Kling — fuera de scope GitHub self-host).

## Veredicto top-2 (para #83)

1. **Remotion** — único con timeline programático + embed nativo Astro (`@remotion/player`) + marca blanca total (no se menciona Odoo en el video). Flujo: plantillas React versionadas → render Lambda/VPS → MP4 a landing Astro + adjunto Odoo. Riesgo: licencia custom — gratis mientras equipo ≤3; al crecer a 4+ pasa a Company ($100/mo mín automators). Pinear `>=4.0.410` por CVE-2026-30120.
2. **MoneyPrinterTurbo (MIT)** — fábrica de drafts shorts (demo 9:16 + voz ES + subtítulos) a costo marginal; API FastAPI integrable desde `modoops_admin` como job externo (no dentro de Odoo). Riesgo: footage Pexels/Pixabay exige verificación clip-por-clip para uso comercial + políticas monetización YouTube + EU AI Act art.50 (etiquetar sintético desde ago-2026). Nunca autopublicar sin revisión humana.

Combo recomendado: Turbo genera borradores → curaduría humana en OpenCut/Kdenlive → piezas finales como componentes Remotion versionados. ComfyUI+Wan solo si hay GPU dedicada o presupuesto fal/Replicate para B-roll IA; no montar ComfyUI en el mismo VPS Odoo (VRAM/CPU + sin auth por defecto → exponer solo tras reverse-proxy con auth).

## Riesgos licencia / mantenimiento

- **Copyleft (GPL-3.0/2.0):** ComfyUI, Kdenlive, LosslessCut, Olive. Si se linkea/empaqueta su código dentro de módulo Odoo propietario hay contagio; usar como **servicio externo aislado** (API/CLI/MP4) o proceso desktop separado. Odoo CE es LGPL-3.0, compatible con uso agregado pero no con mezcla GPL en mismo módulo marca blanca.
- **AGPL:** MoneyPrinterV2 — uso en red obliga a liberar cambios; descartado frente a Turbo MIT.
- **Remotion custom:** techo Free en 3 empleados; presupuestar Company al escalar + telemetry/terms propios.
- **Wan Apache-2.0:** comercialmente permisiva, pero responsabilidad total del contenido generado + hardware (14B exige 24GB VRAM; 1.3B lento en CPU).
- **Mantenimiento:** OpenCut en rewrite (API/headless/MCP aún promesa, no contribuciones); Olive alpha inestable; Kdenlive/LosslessCut/Remotion/Turbo/ComfyUI activos en 2026. Fijar versiones + proxy con auth para todo servicio sin auth (ComfyUI, Turbo API).
