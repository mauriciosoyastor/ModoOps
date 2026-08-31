import { randomUUID } from "node:crypto";
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
};

export type SessionStore = {
  create(odooSessionId: string, session: SessionInfo): string;
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

  create(odooSessionId: string, session: SessionInfo): string {
    const sid = randomUUID();
    this.#map.set(sid, {
      odooSessionId,
      session,
      expiresAt: Date.now() + this.#ttlSeconds * 1000,
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

  create(odooSessionId: string, session: SessionInfo): string {
    const sid = randomUUID();
    const entry: SessionEntry = {
      odooSessionId,
      session,
      expiresAt: Date.now() + this.#ttlSeconds * 1000,
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
    cached = resolveStoreKind() === "file"
      ? new FileSessionStore({ dir: defaultSessionDir(), ttlSeconds })
      : new MemorySessionStore({ ttlSeconds });
  }
  return cached;
}

/** Reset factory cache (tests). */
export function resetSessionStoreCache(): void {
  cached = undefined;
}

export const sessionStore: SessionStore = {
  create(odooSessionId, session) {
    return getSessionStore().create(odooSessionId, session);
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
