import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://modo-ops-web.vercel.app',
  output: 'server',
  adapter: vercel(),
  server: {
    port: 3001,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
