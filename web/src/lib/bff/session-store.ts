import { randomUUID } from "node:crypto";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { SessionInfo } from "./types.ts";
import {
  BFF_COOKIE as _BFF_COOKIE,
  DEFAULT_SESSION_TTL_SECONDS as _DEFAULT_TTL,
  resolveTtl,
  getSessionTtlSeconds,
  getSessionSecret,
  resolveStoreKind,
  defaultSessionDir,
} from "./config.ts";

// Re-export for backward compat (callers que importaban de session-store)
export const BFF_COOKIE = _BFF_COOKIE;
export const DEFAULT_SESSION_TTL_SECONDS = _DEFAULT_TTL;
export { getSessionTtlSeconds };

export type SessionEntry = {
  odooSessionId: string;
  session: SessionInfo;
  expiresAt: number;
  // T3 login-tenant (prototipo): tenant-bound opcional; ausente = sesión master (consultor)
  db?: string;
  slug?: string;
};

export type SessionStore = {
  create(odooSessionId: string, session: SessionInfo, opts?: { db?: string; slug?: string }): string;
  get(bffSid: string): SessionEntry | undefined;
  updateSession(
    bffSid: string,
    session: SessionInfo,
    odooSessionId?: string
  ): boolean;
  destroy(bffSid: string): void;
};

export type SessionStoreOptions = {
  ttlSeconds?: number;
};

function isExpired(entry: SessionEntry): boolean {
  return entry.expiresAt <= Date.now();
}

export class MemorySessionStore implements SessionStore {
  #map = new Map<string, SessionEntry>();
  #ttlSeconds: number;

  constructor(options: SessionStoreOptions = {}) {
    this.#ttlSeconds = resolveTtl(options.ttlSeconds);
  }

  create(odooSessionId: string, session: SessionInfo, opts: { db?: string; slug?: string } = {}): string {
    const sid = randomUUID();
    this.#map.set(sid, {
      odooSessionId,
      session,
      expiresAt: Date.now() + this.#ttlSeconds * 1000,
      ...(opts.db ? { db: opts.db } : {}),
      ...(opts.slug ? { slug: opts.slug } : {}),
    });
    return sid;
  }

  get(bffSid: string): SessionEntry | undefined {
    const entry = this.#map.get(bffSid);
    if (!entry) return undefined;
    if (isExpired(entry)) {
      this.#map.delete(bffSid);
      return undefined;
    }
    return entry;
  }

  updateSession(
    bffSid: string,
    session: SessionInfo,
    odooSessionId?: string
  ): boolean {
    const entry = this.get(bffSid);
    if (!entry) return false;
    this.#map.set(bffSid, {
      ...entry,
      odooSessionId: odooSessionId ?? entry.odooSessionId,
      session,
      expiresAt: Date.now() + this.#ttlSeconds * 1000,
    });
    return true;
  }

  destroy(bffSid: string): void {
    this.#map.delete(bffSid);
  }
}

export type FileSessionStoreOptions = SessionStoreOptions & {
  dir: string;
};

/**
 * @deprecated para edge/Workers — usa Memory/Kv. Mantiene blocking fs para compat local.
 * FileSessionStore hace writeFileSync+renameSync bloqueante (no apto para edge).
 */
export class FileSessionStore implements SessionStore {
  #dir: string;
  #ttlSeconds: number;

  constructor(options: FileSessionStoreOptions) {
    this.#dir = options.dir;
    this.#ttlSeconds = resolveTtl(options.ttlSeconds);
    mkdirSync(this.#dir, { recursive: true });
  }

  #path(bffSid: string): string {
    return join(this.#dir, `${bffSid}.json`);
  }

  create(odooSessionId: string, session: SessionInfo, opts: { db?: string; slug?: string } = {}): string {
    const sid = randomUUID();
    const entry: SessionEntry = {
      odooSessionId,
      session,
      expiresAt: Date.now() + this.#ttlSeconds * 1000,
      ...(opts.db ? { db: opts.db } : {}),
      ...(opts.slug ? { slug: opts.slug } : {}),
    };
    this.#write(sid, entry);
    return sid;
  }

  get(bffSid: string): SessionEntry | undefined {
    const path = this.#path(bffSid);
    if (!existsSync(path)) return undefined;
    try {
      const raw = readFileSync(path, "utf8");
      const entry = JSON.parse(raw) as SessionEntry;
      if (!entry?.odooSessionId || !entry?.session || !entry?.expiresAt) {
        this.destroy(bffSid);
        return undefined;
      }
      if (isExpired(entry)) {
        this.destroy(bffSid);
        return undefined;
      }
      return entry;
    } catch {
      this.destroy(bffSid);
      return undefined;
    }
  }

  updateSession(
    bffSid: string,
    session: SessionInfo,
    odooSessionId?: string
  ): boolean {
    const entry = this.get(bffSid);
    if (!entry) return false;
    this.#write(bffSid, {
      ...entry,
      odooSessionId: odooSessionId ?? entry.odooSessionId,
      session,
      expiresAt: Date.now() + this.#ttlSeconds * 1000,
    });
    return true;
  }

  destroy(bffSid: string): void {
    try {
      unlinkSync(this.#path(bffSid));
    } catch {
      // missing file is fine
    }
  }

  #write(bffSid: string, entry: SessionEntry): void {
    const path = this.#path(bffSid);
    const tmp = `${path}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(entry), "utf8");
    renameSync(tmp, path);
  }
}

let cached: SessionStore | undefined;

export function getSessionStore(): SessionStore {
  if (!cached) {
    const ttlSeconds = getSessionTtlSeconds();
    const kind = resolveStoreKind();
    if (kind === "cookie") {
      cached = new SignedCookieSessionStore({ secret: getSessionSecret(), ttlSeconds });
    } else {
      cached = kind === "file"
        ? new FileSessionStore({ dir: defaultSessionDir(), ttlSeconds })
        : new MemorySessionStore({ ttlSeconds });
    }
  }
  return cached;
}

/**
 * Sesión en cookie firmada (G6) — sin estado en servidor: sobrevive a
 * restarts e instancias serverless. El token ES la sesión (HMAC-SHA256);
 * la revocación ante suspensión la hace el gate por request (tenant-status),
 * no el store. Límite: cookies ~4KB (la sesión Odoo es chica: uid/login/db).
 */
export type SignedCookieStoreOptions = SessionStoreOptions & {
  secret: string;
};

function b64urlEncode(raw: string | Buffer): string {
  return Buffer.from(raw as string).toString("base64url");
}

function b64urlDecode(raw: string): Buffer {
  return Buffer.from(raw, "base64url");
}

export function sealSession(entry: SessionEntry, secret: string): string {
  const payload = b64urlEncode(JSON.stringify(entry));
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `v1.${payload}.${sig}`;
}

export function unsealSession(token: string, secret: string): SessionEntry | undefined {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return undefined;
  const [, payload, sig] = parts;
  let expected: string;
  try {
    expected = createHmac("sha256", secret).update(payload).digest("base64url");
  } catch {
    return undefined;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;
  let entry: SessionEntry;
  try {
    entry = JSON.parse(b64urlDecode(payload).toString("utf8")) as SessionEntry;
  } catch {
    return undefined;
  }
  if (!entry || typeof entry.odooSessionId !== "string" || typeof entry.session !== "object" || !entry.session) {
    return undefined;
  }
  return entry;
}

export class SignedCookieSessionStore implements SessionStore {
  #secret: string;
  #ttlSeconds: number;

  constructor(options: SignedCookieStoreOptions) {
    if (!options.secret) throw new Error("SignedCookieSessionStore requiere secret");
    this.#secret = options.secret;
    this.#ttlSeconds = resolveTtl(options.ttlSeconds);
  }

  create(odooSessionId: string, session: SessionInfo, opts: { db?: string; slug?: string } = {}): string {
    const entry: SessionEntry = {
      odooSessionId,
      session,
      expiresAt: Date.now() + this.#ttlSeconds * 1000,
      ...(opts.db ? { db: opts.db } : {}),
      ...(opts.slug ? { slug: opts.slug } : {}),
    };
    return sealSession(entry, this.#secret);
  }

  get(bffSid: string): SessionEntry | undefined {
    const entry = unsealSession(bffSid, this.#secret);
    if (!entry) return undefined;
    if (typeof entry.expiresAt !== "number" || isExpired(entry)) return undefined;
    return entry;
  }

  updateSession(): boolean {
    // Sin estado servidor no hay nada que reescribir: el refresh lo hace un
    // login nuevo. Nadie lo llama hoy (sin callers); false = no soportado.
    return false;
  }

  destroy(): void {
    // Sin estado: el logout borra la cookie en el cliente (clearBffCookie).
  }
}

/** Reset factory cache (tests). */
export function resetSessionStoreCache(): void {
  cached = undefined;
}

export const sessionStore: SessionStore = {
  create(odooSessionId, session, opts) {
    return getSessionStore().create(odooSessionId, session, opts);
  },
  get(bffSid) {
    return getSessionStore().get(bffSid);
  },
  updateSession(bffSid, session, odooSessionId) {
    return getSessionStore().updateSession(bffSid, session, odooSessionId);
  },
  destroy(bffSid) {
    getSessionStore().destroy(bffSid);
  },
};
