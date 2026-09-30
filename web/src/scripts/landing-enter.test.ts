import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initLandingEnter } from './landing-enter';

type FakeEl = {
  classList: {
    add: (c: string) => void;
    contains: (c: string) => boolean;
  };
};

function fakeEl(): FakeEl {
  const set = new Set<string>();
  return {
    classList: {
      add: (c) => {
        set.add(c);
      },
      contains: (c) => set.has(c),
    },
  };
}

describe('initLandingEnter', () => {
  let observe: ReturnType<typeof vi.fn>;
  let unobserve: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;
  let lastCb: IntersectionObserverCallback | null;
  let htmlClassAdd: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    lastCb = null;
    htmlClassAdd = vi.fn();
    vi.stubGlobal('document', {
      documentElement: { classList: { add: htmlClassAdd } },
      querySelectorAll: () => [],
    });
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((cb: IntersectionObserverCallback) => {
        lastCb = cb;
        return {
          observe,
          unobserve,
          disconnect,
          takeRecords: () => [],
          root: null,
          rootMargin: '',
          thresholds: [],
        };
      }),
    );
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        media: '',
        onchange: null,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marca html.lp-enter-js para progressive enhancement', () => {
    initLandingEnter({ root: { querySelectorAll: () => [] } as unknown as ParentNode });
    expect(htmlClassAdd).toHaveBeenCalledWith('lp-enter-js');
  });

  it('no-op cleanup when no nodes', () => {
    const root = { querySelectorAll: () => [] };
    const stop = initLandingEnter({ root: root as unknown as ParentNode });
    expect(typeof stop).toBe('function');
    expect(observe).not.toHaveBeenCalled();
  });

  it('observa nodos data-lp-enter y marca is-in al intersectar', () => {
    const a = fakeEl();
    const b = fakeEl();
    const root = { querySelectorAll: () => [a, b] };
    initLandingEnter({ root: root as unknown as ParentNode });
    expect(observe).toHaveBeenCalledTimes(2);
    expect(lastCb).toBeTruthy();
    lastCb!(
      [
        {
          isIntersecting: true,
          target: a as unknown as Element,
          intersectionRatio: 0.3,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
        },
      ],
      {} as IntersectionObserver,
    );
    expect(a.classList.contains('is-in')).toBe(true);
    expect(unobserve).toHaveBeenCalledWith(a);
  });

  it('con reduced-motion marca is-in sin observar', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
      })),
    );
    const a = fakeEl();
    const root = { querySelectorAll: () => [a] };
    initLandingEnter({ root: root as unknown as ParentNode });
    expect(a.classList.contains('is-in')).toBe(true);
    expect(observe).not.toHaveBeenCalled();
  });
});
