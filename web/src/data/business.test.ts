import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseUtm, whatsappWithUtm, contact } from './business';

describe('parseUtm', () => {
  it('filtra solo allowlist utm_* + gclid/fbclid', () => {
    expect(parseUtm('?utm_source=ig&utm_medium=cpc&foo=bar&email=x@y.com')).toBe(
      'utm_source=ig&utm_medium=cpc',
    );
  });
  it('preserva gclid y fbclid', () => {
    expect(parseUtm('?gclid=abc&fbclid=xyz&utm_campaign=test')).toBe(
      'utm_campaign=test&gclid=abc&fbclid=xyz',
    );
  });
  it('vacío o sin utm devuelve ""', () => {
    expect(parseUtm('')).toBe('');
    expect(parseUtm('?foo=bar')).toBe('');
    expect(parseUtm('?')).toBe('');
  });
  it('soporta search sin ? inicial', () => {
    expect(parseUtm('utm_source=ig')).toBe('utm_source=ig');
  });
  it('ordena según ALLOWED_UTM_KEYS, no según input', () => {
    expect(parseUtm('?utm_term=t&utm_source=s&utm_medium=m')).toBe(
      'utm_source=s&utm_medium=m&utm_term=t',
    );
  });
});

describe('whatsappWithUtm', () => {
  const originalWindow = globalThis.window as any;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('SSR sin window no incluye UTM', () => {
    // @ts-ignore
    delete (globalThis as any).window;
    const url = whatsappWithUtm('hero');
    expect(url).toBe(`${contact.whatsapp}?text=${encodeURIComponent('Hola ModoOps — vengo de hero — rubro: __, ciudad: __, cajas: __')}`);
    // restore for next tests
    (globalThis as any).window = originalWindow;
  });

  it('con utm en location.search lo incluye y lo persiste en sessionStorage', () => {
    const store: Record<string, string> = {};
    const fakeWindow: any = {
      location: { search: '?utm_source=ig&utm_medium=cpc&foo=bar' },
      sessionStorage: {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => { store[k] = v; },
      },
    };
    (globalThis as any).window = fakeWindow;
    const url = whatsappWithUtm('hero');
    expect(url).toContain(encodeURIComponent('(utm_source=ig&utm_medium=cpc)'));
    expect(url).not.toContain('foo=bar');
    expect(store['modoops_utm']).toBe('utm_source=ig&utm_medium=cpc');
  });

  it('sin utm en search pero con UTM en sessionStorage lo recupera', () => {
    const store: Record<string, string> = { modoops_utm: 'utm_source=fb' };
    const fakeWindow: any = {
      location: { search: '' },
      sessionStorage: {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => { store[k] = v; },
      },
    };
    (globalThis as any).window = fakeWindow;
    const url = whatsappWithUtm('contact');
    expect(url).toContain(encodeURIComponent('(utm_source=fb)'));
  });

  it('no persiste PII fuera de allowlist', () => {
    const store: Record<string, string> = {};
    const fakeWindow: any = {
      location: { search: '?email=x@y.com&utm_source=ig' },
      sessionStorage: {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => { store[k] = v; },
      },
    };
    (globalThis as any).window = fakeWindow;
    const url = whatsappWithUtm('floating');
    expect(url).toContain(encodeURIComponent('utm_source=ig'));
    expect(url).not.toContain('email');
    expect(url).not.toContain('x%40y.com');
  });
});
