/**
 * With NUXT_NOINDEX=true (staging), every response asks search engines not
 * to index it. robots.txt still lets them crawl — they have to fetch a page
 * to see this header.
 */
export default defineEventHandler((event) => {
  if (useRuntimeConfig(event).noindex) setResponseHeader(event, 'X-Robots-Tag', 'noindex')
})
