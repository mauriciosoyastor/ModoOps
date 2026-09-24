/**
 * Shared light-app chrome — leave rituals (toast/dialog/sheet/overflow) + focus trap.
 * Prototipos CP/Shell (#187 Emil pass 3).
 */

export function resolveLeaveMs(reduceMotion: boolean, baseMs = 120): number {
  return reduceMotion ? 0 : baseMs;
}

export type EnterOpts = {
  /** Dialog/sheet: `is-open` (default). */
  openClass?: string;
  /** Overflow / create-panel: `is-in`. */
  inClass?: string;
};

export function openWithEnter(el: HTMLElement, opts: EnterOpts = {}): void {
  const openClass = opts.openClass ?? 'is-open';
  el.classList.remove('is-leaving', 'is-out');
  el.hidden = false;
  void el.offsetWidth;
  if (opts.inClass) el.classList.add(opts.inClass);
  else el.classList.add(openClass);
}

export type LeaveOpts = {
  leaveMs: number;
  openClass?: string;
  inClass?: string;
  leavingClass?: string;
  onDone?: () => void;
};

export function closeWithLeave(el: HTMLElement, opts: LeaveOpts): void {
  const openClass = opts.openClass ?? 'is-open';
  const leavingClass = opts.leavingClass ?? 'is-leaving';
  if (opts.inClass) el.classList.remove(opts.inClass);
  el.classList.remove(openClass);
  el.classList.add(leavingClass);

  const finish = () => {
    el.hidden = true;
    el.classList.remove(leavingClass);
    opts.onDone?.();
  };

  if (opts.leaveMs <= 0) finish();
  else globalThis.setTimeout(finish, opts.leaveMs);
}

const FOCUSABLE_SEL =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function listFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SEL)).filter((node) => {
    if (typeof node.hasAttribute === 'function' && node.hasAttribute('disabled')) return false;
    if (typeof node.getAttribute === 'function' && node.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    return true;
  });
}

export function trapTabKey(
  root: HTMLElement,
  ev: KeyboardEvent,
  active: Element | null = typeof document !== 'undefined' ? document.activeElement : null,
): void {
  if (ev.key !== 'Tab') return;
  const list = listFocusable(root);
  if (list.length === 0) return;
  const first = list[0];
  const last = list[list.length - 1];
  if (ev.shiftKey && active === first) {
    ev.preventDefault();
    last.focus();
  } else if (!ev.shiftKey && active === last) {
    ev.preventDefault();
    first.focus();
  }
}

export type ToastKind = 'ok' | 'danger';

export type ShowToastOpts = {
  region: HTMLElement;
  title: string;
  text: string;
  kind?: ToastKind;
  holdMs?: number;
  leaveMs?: number;
  announce?: (msg: string) => void;
};

export function showToast(opts: ShowToastOpts): void {
  const {
    region,
    title,
    text,
    kind = 'ok',
    holdMs = 3000,
    leaveMs = 120,
    announce,
  } = opts;
  const node = document.createElement('div');
  node.className = `mo-toast mo-toast--${kind}`;
  node.setAttribute('role', 'status');
  const titleEl = document.createElement('p');
  titleEl.className = 'mo-toast__title';
  titleEl.textContent = title;
  const textEl = document.createElement('p');
  textEl.className = 'mo-toast__text';
  textEl.textContent = text;
  node.append(titleEl, textEl);
  region.appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-in'));
  announce?.(`${title}. ${text}`);
  globalThis.setTimeout(() => {
    node.classList.remove('is-in');
    node.classList.add('is-out');
    globalThis.setTimeout(() => node.remove(), leaveMs);
  }, holdMs);
}

/** Fade bulk/bar in or out without hard-cut when leaveMs > 0. */
export function setFadedVisible(
  el: HTMLElement,
  visible: boolean,
  leaveMs: number,
): void {
  if (visible) {
    el.classList.remove('is-out');
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('is-in');
    return;
  }
  if (el.hidden && !el.classList.contains('is-in')) return;
  el.classList.remove('is-in');
  el.classList.add('is-out');
  const finish = () => {
    el.hidden = true;
    el.classList.remove('is-out');
  };
  if (leaveMs <= 0) finish();
  else globalThis.setTimeout(finish, leaveMs);
}
