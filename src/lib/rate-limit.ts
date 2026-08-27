// Sliding-window in-memory rate limiter. Works per server instance (Node.js runtime).
// For multi-instance deployments, replace store with Upstash Redis.

const store = new Map<string, number[]>()

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number }

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs
  const hits = (store.get(key) ?? []).filter(t => t > windowStart)

  if (hits.length >= maxRequests) {
    const retryAfter = Math.ceil((hits[0] + windowMs - now) / 1000)
    return { ok: false, retryAfter }
  }

  hits.push(now)
  store.set(key, hits)

  if (store.size > 10_000) {
    for (const [k, ts] of store) {
      if (ts.filter(t => t > windowStart).length === 0) store.delete(k)
    }
  }

  return { ok: true }
}

export function rateLimitKey(req: Request, suffix = ''): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'
  return suffix ? `${ip}:${suffix}` : ip
}

export function rateLimitResponse(retryAfter: number) {
  return Response.json(
    { error: 'Te veel verzoeken. Probeer het zo opnieuw.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}
