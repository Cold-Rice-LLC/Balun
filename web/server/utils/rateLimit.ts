/**
 * Fixed-window rate limit, in memory. True while `key` is under `limit` hits
 * in the current window. On Vercel each warm function instance keeps its own
 * map, so the cap is per instance rather than global — enough to blunt a
 * burst from one IP, not a hard guarantee. Expired windows are swept when the
 * map grows, so it stays small.
 */
const windows = new Map<string, { count: number; resetAt: number }>()
const SWEEP_AT = 1000

export const rateLimit = (
  key: string,
  { limit, windowMs, now = Date.now() }: { limit: number; windowMs: number; now?: number },
) => {
  if (windows.size > SWEEP_AT) {
    for (const [k, entry] of windows) if (entry.resetAt <= now) windows.delete(k)
  }
  const entry = windows.get(key)
  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  entry.count += 1
  return entry.count <= limit
}
