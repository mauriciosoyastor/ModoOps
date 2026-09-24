import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveLeaveMs,
  openWithEnter,
  closeWithLeave,
  trapTabKey,
  listFocusable,
} from './light-app-chrome.ts';

function stubEl(initial: { hidden?: boolean; classes?: string[] } = {}) {
  const classes = new Set(initial.classes ?? []);
  const el = {
    hidden: initial.hidden ?? true,
    offsetWidth: 1,
    classList: {
      add: (...xs: string[]) => xs.forEach((c) => classes.add(c)),
      remove: (...xs: string[]) => xs.forEach((c) => classes.delete(c)),
      contains: (c: string) => classes.has(c),
    },
    focus: vi.fn(),
    querySelectorAll: vi.fn(() => [] as unknown as NodeListOf<HTMLElement>),
    _classes: classes,
  };
  return el as unknown as HTMLElement & { _classes: Set<string> };
}

describe('light-app-chrome — leave timing', () => {
  it('resolveLeaveMs es 0 con reduced motion y base si no', () => {
    expect(resolveLeaveMs(true, 120)).toBe(0);
    expect(resolveLeaveMs(false, 120)).toBe(120);
    expect(resolveLeaveMs(false, 140)).toBe(140);
  });
});

describe('light-app-chrome — enter/exit overlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('openWithEnter muestra el nodo y aplica clase de entrada', () => {
    const el = stubEl({ hidden: true });
    openWithEnter(el, { inClass: 'is-in' });
    expect(el.hidden).toBe(false);
    expect(el.classList.contains('is-in')).toBe(true);
  });

  it('closeWithLeave aplica is-out, espera leaveMs y recién ahí oculta', () => {
    const el = stubEl({ hidden: false, classes: ['is-in'] });
    const onDone = vi.fn();
    closeWithLeave(el, {
      leaveMs: 120,
      inClass: 'is-in',
      leavingClass: 'is-out',
      onDone,
    });
    expect(el.classList.contains('is-in')).toBe(false);
    expect(el.classList.contains('is-out')).toBe(true);
    expect(el.hidden).toBe(false);
    expect(onDone).not.toHaveBeenCalled();

    vi.advanceTimersByTime(119);
    expect(el.hidden).toBe(false);

    vi.advanceTimersByTime(1);
    expect(el.hidden).toBe(true);
    expect(el.classList.contains('is-out')).toBe(false);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('closeWithLeave con leaveMs 0 oculta al instante', () => {
    const el = stubEl({ hidden: false, classes: ['is-open'] });
    closeWithLeave(el, { leaveMs: 0, openClass: 'is-open' });
    expect(el.hidden).toBe(true);
    expect(el.classList.contains('is-leaving')).toBe(false);
  });
});

describe('light-app-chrome — focus trap', () => {
  it('listFocusable ignora nodos disabled', () => {
    const a = {
      hasAttribute: () => false,
      getAttribute: () => null,
    } as unknown as HTMLElement;
    const b = {
      hasAttribute: (n: string) => n === 'disabled',
      getAttribute: () => null,
    } as unknown as HTMLElement;
    const root = {
      querySelectorAll: () => [a, b] as unknown as NodeListOf<HTMLElement>,
    } as unknown as HTMLElement;
    expect(listFocusable(root)).toEqual([a]);
  });

  it('trapTabKey en el último foco cicla al primero', () => {
    const first = {
      focus: vi.fn(),
      hasAttribute: () => false,
      getAttribute: () => null,
    } as unknown as HTMLElement;
    const last = {
      focus: vi.fn(),
      hasAttribute: () => false,
      getAttribute: () => null,
    } as unknown as HTMLElement;
    const root = {
      querySelectorAll: () => [first, last] as unknown as NodeListOf<HTMLElement>,
    } as unknown as HTMLElement;

    const ev = {
      key: 'Tab',
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    trapTabKey(root, ev, last);
    expect(ev.preventDefault).toHaveBeenCalled();
    expect(first.focus).toHaveBeenCalled();
  });
});
