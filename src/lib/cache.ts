/**
 * Tiny localStorage TTL cache for CSV data.
 * Browser-only: silently no-ops if localStorage is unavailable (SSR, private mode).
 */

const PREFIX = "ca-inter:cache:";

interface Envelope<T> {
  v: T;
  t: number;
}

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function cacheGet<T>(key: string, maxAgeMs: number): T | null {
  const ls = storage();
  if (!ls) return null;
  const raw = ls.getItem(PREFIX + key);
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as Envelope<T>;
    if (Date.now() - env.t > maxAgeMs) return null;
    return env.v;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, value: T): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(PREFIX + key, JSON.stringify({ v: value, t: Date.now() } satisfies Envelope<T>));
  } catch {
    /* quota or json error — silently drop */
  }
}

export function cacheClear(prefix = ""): void {
  const ls = storage();
  if (!ls) return;
  const full = PREFIX + prefix;
  const toRemove: string[] = [];
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k && k.startsWith(full)) toRemove.push(k);
  }
  toRemove.forEach((k) => ls.removeItem(k));
}
