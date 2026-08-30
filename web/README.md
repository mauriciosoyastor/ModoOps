# Landing — GalaxyGroup

Esqueleto Astro + Tailwind v4 (visual **Neuralink adaptado**).

## Documentación

- Contenido: [`../docs/marketing-one-pager.md`](../docs/marketing-one-pager.md)
- Diseño: [`../docs/DESIGN.md`](../docs/DESIGN.md)
- Arquitectura: [`../docs/landing-architecture.md`](../docs/landing-architecture.md)

## Desarrollo

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000` (puerto definido en `astro.config.mjs`).

## Formspree (formulario de contacto)

1. Entrá a [formspree.io](https://formspree.io) e iniciá sesión (puede ser con Google).
2. **New form** → nombre ej. `GalaxyGroup — web`.
3. Email de notificación: `consultoria.matasini@gmail.com`.
4. Copiá el **Form ID** de la URL `https://formspree.io/f/`**`ESTE_ID`**.
5. En `web/`, creá el archivo `.env`:

   ```env
   PUBLIC_FORMSPREE_FORM_ID=ESTE_ID
   ```

6. Reiniciá `npm run dev`. Probá enviar el formulario; deberías volver a `/?enviado=1#contacto` con mensaje de gracias.

En producción, configurá la misma variable en el panel de tu hosting (Cloudflare Pages → Environment variables).

## Pendiente

- [ ] `site` en `astro.config.mjs` (dominio real, para redirects correctos)
- [ ] Favicon
- [ ] `npm run build` en CI o deploy Cloudflare Pages
