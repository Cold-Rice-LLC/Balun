import type { EventHandler } from 'h3'
import type { CachedEventHandlerOptions } from 'nitropack/types'

/**
 * defineCachedEventHandler with an off switch: NUXT_DISABLE_CACHE=true sends
 * every request straight to the handler with Cache-Control: no-store. Nitro's
 * own shouldBypassCache isn't enough — it skips the store but still stamps
 * the s-maxage header, so an edge or browser would cache the response anyway.
 * The flag is read per request, so flipping the env var needs only a restart
 * (or redeploy), no rebuild.
 */
export const defineSwitchableCachedHandler = (handler: EventHandler, opts: CachedEventHandlerOptions) => {
  const cached = defineCachedEventHandler(handler, opts)

  return defineEventHandler(async (event) => {
    if (useRuntimeConfig(event).disableCache) {
      setResponseHeader(event, 'Cache-Control', 'no-store')
      return handler(event)
    }

    const body = await cached(event)
    browserRevalidates(event)
    return body
  })
}

/**
 * Nitro stamps `s-maxage=N, stale-while-revalidate` plus a Last-Modified
 * date. s-maxage only binds shared caches, so a browser falls back to
 * heuristic freshness off Last-Modified — and kept serving a product
 * response (sizes, availability) 90 minutes old. max-age=0 makes the browser
 * revalidate every time (a cheap 304 against the ETag) while the edge keeps
 * its s-maxage window unchanged.
 */
const browserRevalidates = (event: Parameters<EventHandler>[0]) => {
  if (event.handled) return
  const header = getResponseHeader(event, 'Cache-Control')
  if (typeof header !== 'string' || /(^|,)\s*max-age=/.test(header)) return
  setResponseHeader(event, 'Cache-Control', `max-age=0, ${header}`)
}
