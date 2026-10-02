/**
 * Landing enter-on-view — una sola vez por nodo `[data-lp-enter]`.
 * Solo marca `.is-in`; el motion vive en CSS (--mo-ease-out).
 * Progressive enhancement: el CSS solo oculta nodos cuando `html.lp-enter-js`.
 */
export type LandingEnterOptions = {
  root?: ParentNode;
  threshold?: number;
  rootMargin?: string;
};

export function initLandingEnter(opts: LandingEnterOptions = {}): () => void {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('lp-enter-js');
  }

  const root = opts.root ?? document;
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-lp-enter]'));
  if (nodes.length === 0) return () => {};

  if (typeof IntersectionObserver === 'undefined') {
    for (const el of nodes) el.classList.add('is-in');
    return () => {};
  }

  const reduce =
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add('is-in');
        io.unobserve(el);
      }
    },
    {
      threshold: opts.threshold ?? 0.25,
      rootMargin: opts.rootMargin ?? '0px 0px -8% 0px',
    },
  );

  for (const el of nodes) {
    if (reduce) {
      el.classList.add('is-in');
      continue;
    }
    io.observe(el);
  }

  return () => io.disconnect();
}
