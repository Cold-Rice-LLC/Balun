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

  return defineEventHandler((event) => {
    if (!useRuntimeConfig(event).disableCache) return cached(event)
    setResponseHeader(event, 'Cache-Control', 'no-store')
    return handler(event)
  })
}
