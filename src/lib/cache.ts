// In-memory TTL cache. Persists within the Node.js server process.
// Safe to use for agency/user profile data that changes rarely.

interface Entry<T> {
  value: T
  expires: number
}

const store = new Map<string, Entry<unknown>>()

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as Entry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.expires) {
    store.delete(key)
    return null
  }
  return entry.value
}

export function cacheSet<T>(key: string, value: T, ttlMs = 30_000): void {
  store.set(key, { value, expires: Date.now() + ttlMs })
}

export function cacheDel(key: string): void {
  store.delete(key)
}

export function cacheClear(prefix: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k)
  }
}

// Convenience: fetch-or-set pattern
export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = cacheGet<T>(key)
  if (hit !== null) return hit
  const value = await fn()
  cacheSet(key, value, ttlMs)
  return value
}
