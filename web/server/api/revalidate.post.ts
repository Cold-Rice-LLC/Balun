import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'

/**
 * Publish webhook: POST /api/revalidate
 *
 * Sanity calls this on every publish (see docs/performance-caching.md for
 * the webhook's filter and projection, which sends `{_type, slug}`). The
 * pages showing that document are re-rendered on the spot in Vercel's page
 * cache, so an edit is live in seconds while pages otherwise stay cached for
 * 10 minutes. Re-rendering reads Sanity's live API (runtimeConfig.sanity in
 * nuxt.config), so it never picks up a stale CDN copy of the change.
 *
 * Also the pre-launch warm-up: an empty POST with `Authorization: Bearer
 * <webhook secret>` re-renders every page, so the first visitors after a
 * deploy get cached pages.
 *
 * Works on Vercel only: it asks Vercel to re-render each path by sending its
 * ISR bypass token (NUXT_ISR_BYPASS_TOKEN, also baked into the build).
 */

const CONCURRENCY = 10

export default defineEventHandler(async (event) => {
  const { sanityWebhookSecret: secret, isrBypassToken } = useRuntimeConfig(event)
  if (!secret || !isrBypassToken) {
    throw createError({ statusCode: 503, statusMessage: 'Revalidation not configured' })
  }

  const raw = (await readRawBody(event, 'utf8')) ?? ''
  const signature = getHeader(event, SIGNATURE_HEADER_NAME)
  const authorized = signature
    ? await isValidSignature(raw, signature, secret)
    : getHeader(event, 'authorization') === `Bearer ${secret}`
  if (!authorized) throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })

  const doc = raw ? (JSON.parse(raw) as { _type?: string; slug?: string }) : {}
  const urls = localizedUrls(event, await pagePathsFor(event, doc._type, doc.slug))

  const origin = getRequestURL(event).origin
  const failed: string[] = []
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    await Promise.all(
      urls.slice(i, i + CONCURRENCY).map(async (url) => {
        const res = await fetch(origin + url, {
          method: 'HEAD',
          headers: { 'x-prerender-revalidate': isrBypassToken },
        }).catch(() => null)
        // A missing page (an unpublished product) is a 404: nothing to refresh.
        if (!res || (!res.ok && res.status !== 404)) failed.push(url)
      }),
    )
  }

  return { type: doc._type ?? 'all', revalidated: urls.length - failed.length, failed }
})
