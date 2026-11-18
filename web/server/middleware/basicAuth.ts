/**
 * With NUXT_BASIC_AUTH_PASSWORD set (pre-launch / staging), every request
 * needs HTTP basic auth — a whole-site password gate that works on any
 * Vercel plan. Exempt:
 * - The Mux webhook: Mux can't log in, and the route verifies its own
 *   signature.
 * - @nuxtjs/i18n's UI-string catalogs (/_i18n/…/messages.json): server
 *   rendering loads them with an internal $fetch that carries no
 *   Authorization header, so gating them renders every string as its bare
 *   key. They're the same public strings the pages show.
 */
const EXEMPT_PATHS = ['/api/mux/webhook']
const EXEMPT_PREFIXES = ['/_i18n/']

export default defineEventHandler((event) => {
  const { basicAuthUser, basicAuthPassword } = useRuntimeConfig(event)
  const path = event.path.split('?')[0]!
  if (!basicAuthPassword || EXEMPT_PATHS.includes(path) || EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return
  }

  const expected = `Basic ${btoa(`${basicAuthUser}:${basicAuthPassword}`)}`
  if (getRequestHeader(event, 'authorization') === expected) return

  setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="Balun", charset="UTF-8"')
  throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
})
