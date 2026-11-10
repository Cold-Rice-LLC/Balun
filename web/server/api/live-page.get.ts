import { liveQuery } from '../../app/utils/queries'

/**
 * The live page's editorial corner: GET /api/live-page?locale=en-us
 *
 * The locale's live page (location, description, featured product, SEO),
 * for the page to render and re-check while open — through here rather than
 * from each browser, so the re-checks of a big audience land on Vercel's
 * edge (60s cache, stamped as s-maxage) instead of Sanity. A featured
 * product swapped mid-stream shows up within about a minute.
 */
export default defineSwitchableCachedHandler(
  (event) => {
    const { market, lang } = localeParams(event)
    return useSanity().fetch(liveQuery, { market, lang })
  },
  {
    maxAge: 60,
    swr: true,
    getKey: (event) => `live-page-${getQuery(event).locale}`,
  },
)
