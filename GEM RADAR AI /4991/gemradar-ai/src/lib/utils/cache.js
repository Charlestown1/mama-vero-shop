// Minimal in-memory TTL cache for PUBLIC, non-user-specific data only
// (market overview, top movers, token prices). Never put anything
// user-specific in here — this Map is shared across every request the
// server process handles, so a per-user response cached here would leak
// between users. Resets on server restart/redeploy, which is fine for
// data this short-lived.
const store = new Map();

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) { store.delete(key); return undefined; }
  return entry.value;
}

export function setCached(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function withCache(key, ttlMs, fn) {
  const cached = getCached(key);
  if (cached !== undefined) return cached;
  const value = await fn();
  setCached(key, value, ttlMs);
  return value;
}
