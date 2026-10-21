/**
 * With NUXT_BASIC_AUTH_PASSWORD set (pre-launch / staging), every request
 * needs HTTP basic auth — a whole-site password gate that works on any
 * Vercel plan. The Mux webhook is exempt: Mux can't log in, and the route
 * verifies its own signature.
 */
const EXEMPT_PATHS = ['/api/mux/webhook']

export default defineEventHandler((event) => {
  const { basicAuthUser, basicAuthPassword } = useRuntimeConfig(event)
  if (!basicAuthPassword || EXEMPT_PATHS.includes(event.path.split('?')[0]!)) return

  const expected = `Basic ${btoa(`${basicAuthUser}:${basicAuthPassword}`)}`
  if (getRequestHeader(event, 'authorization') === expected) return

  setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="Balun", charset="UTF-8"')
  throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
})
