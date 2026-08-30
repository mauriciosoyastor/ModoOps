# Landing — ModoOps

Esqueleto Astro + Tailwind v4 (visual **Neuralink adaptado** — `../docs/DESIGN.md`).

## Documentación
- Contenido canónico: [`../docs/marketing-one-pager.md`](../docs/marketing-one-pager.md) (8 secciones)
- Diseño: [`../docs/DESIGN.md`](../docs/DESIGN.md)
- Arquitectura: [`../docs/landing-architecture.md`](../docs/landing-architecture.md)
- Negocio: [`../CONTEXT.md`](../CONTEXT.md) — marca blanca, precios USD

## Desarrollo
```bash
# Desde la raíz del repo (canónico)
npm install
npm --prefix web run dev   # http://localhost:3001
npm run build              # root → web install + astro build
```

## Deploy — contrato Cloudflare Workers Builds (no divergir)

Un solo layout: **Root directory vacío** (repo root). No uses `web/` como root ni un segundo `web/wrangler.toml`.

| Setting | Valor canónico |
|---|---|
| Root directory | *(vacío)* |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy --config wrangler.toml --no-autoconfig` |
| Version command (PRs) | `npx wrangler versions upload --config wrangler.toml` *(sin `--no-autoconfig`)* |

Validar en CI/local: `npm run check:deploy-contract`.

Scripts que **no** reintroducir (causan conflictos entre ramas):
- `npm run build -w galaxygroup-web` / `-w modoops-web`
- Build command que salte el root y no instale `web`

## Contacto
Sin Formspree en v1 — `mailto:consultoria.matasini@gmail.com` + WhatsApp `+54 9 354 753-2008` directo (ver `src/data/business.ts`).

## Pendiente
- [ ] `site` en `astro.config.mjs` → dominio final (hoy preview Workers)
- [ ] Favicon / OG image ModoOps
