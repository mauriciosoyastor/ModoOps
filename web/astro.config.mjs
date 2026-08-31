import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://example.com',
  output: 'server',
  adapter: cloudflare(),
  server: {
    port: 3001,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
