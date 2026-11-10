/**
 * Draft preview: a request with ?preview=true renders Sanity's drafts
 * (unpublished edits) instead of published content. The Studio's "Open
 * preview" action links here. See docs/preview.md.
 *
 * Only works where pages aren't cached — dev, and a cache-off deploy (the
 * password-gated staging site): Vercel's page cache keys on the path alone,
 * so on a cached deploy the query never reaches the server and visitors just
 * get the published page. The read token is server-only and set only on the
 * preview deploy.
 *
 * The helper's `fetch` calls a client held in its closure — reassigning
 * `sanity.client` changes nothing. `setToken()` rebuilds that client from
 * the helper's (shared) config object, so the perspective goes on the config
 * first. Plugins run before pages, so every fetch in this render sees drafts;
 * browser-side fetches after hydration (and client-side navigation) are
 * published again, which is why the banner's exit is a full reload.
 */
export default defineNuxtPlugin(() => {
  if (useRequestURL().searchParams.get('preview') !== 'true') return

  const token = useRuntimeConfig().sanityPreviewToken
  if (!token) {
    console.warn('[preview] NUXT_SANITY_PREVIEW_TOKEN is not set; rendering published content')
    return
  }

  const sanity = useSanity()
  Object.assign(sanity.config, { perspective: 'drafts', useCdn: false })
  sanity.setToken(token)
  // Read by PreviewBanner: only a render that really fetched drafts says so.
  useState('preview-active').value = true

  // Drafts are never indexed or kept by a CDN.
  const event = useRequestEvent()
  if (event) {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex')
    setResponseHeader(event, 'Cache-Control', 'no-store')
  }
})
