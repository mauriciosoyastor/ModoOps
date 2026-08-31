/** Worker passthrough — BFF ahora en web/src/pages/api/modoops/[db]/agent/* (Astro SSR) */
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
