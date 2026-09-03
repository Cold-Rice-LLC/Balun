import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verifies a Mux webhook delivery. The `Mux-Signature` header carries
 * `t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">` keyed by the
 * endpoint's signing secret. False without a valid signature, or if the
 * timestamp is older than the tolerance (replay guard).
 */
export const verifyMuxSignature = (
  header: string,
  rawBody: string,
  secret: string,
  { now = Date.now(), toleranceSeconds = 5 * 60 } = {},
) => {
  const parts = Object.fromEntries(header.split(',').map((part) => part.split('=') as [string, string]))
  const timestamp = Number(parts.t)
  if (!Number.isFinite(timestamp) || Math.abs(now / 1000 - timestamp) > toleranceSeconds) return false
  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex')
  return (
    typeof parts.v1 === 'string' &&
    parts.v1.length === expected.length &&
    timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected))
  )
}
