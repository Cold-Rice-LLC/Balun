/**
 * With the build's files on another host (NUXT_APP_CDN_URL), Nuxt also links
 * each page's first _payload.json through that host, so it loads
 * cross-origin and needs CORS like the code files do (/_nuxt/** in
 * nuxt.config routeRules). A route rule can't match a path's last segment,
 * hence this. The header is cached with the page in Vercel's ISR.
 */
export default defineEventHandler((event) => {
  if (event.path.split('?')[0]!.endsWith('/_payload.json')) {
    setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  }
})
