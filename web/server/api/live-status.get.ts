import { createClient } from '@sanity/client'
import { liveStatusQuery } from '../../app/utils/queries'

/**
 * The stream's switches: GET /api/live-status?locale=en-us
 *
 * Live Now, the source (Mux or YouTube) and what each plays, from Site
 * Settings, plus the locale's live page location label for the nav's live
 * tab. Browsers check this (the nav as visitors move around, the live page
 * on a timer, faster while waiting for the stream), never Sanity directly: the 5s cache, stamped as
 * s-maxage, lets Vercel's edge answer the polls, so Sanity sees about one
 * request per 5s per locale however many people are on the site. Read from
 * the live API (no CDN) so the cache is the only lag. See
 * docs/live-streaming.md and docs/performance-caching.md.
 */

export interface LiveStatus {
  isLive: boolean
  liveSource: 'mux' | 'youtube'
  muxPlaybackId: string | null
  youtubeUrl: string | null
  location: string | null
}

export default defineSwitchableCachedHandler(
  async (event): Promise<LiveStatus> => {
    const { market, lang } = localeParams(event)
    const { sanity } = useRuntimeConfig(event).public
    const client = createClient({
      projectId: sanity.projectId,
      dataset: sanity.dataset,
      apiVersion: sanity.apiVersion,
      useCdn: false,
    })

    return client.fetch(liveStatusQuery, { market, lang })
  },
  {
    maxAge: 5,
    swr: true,
    getKey: (event) => `live-status-${getQuery(event).locale}`,
  },
)
