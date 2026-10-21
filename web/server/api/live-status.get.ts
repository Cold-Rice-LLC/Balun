import { createClient } from '@sanity/client'

/**
 * The stream's switches: GET /api/live-status
 *
 * Live Now, the source (Mux or YouTube) and what each plays, from Site
 * Settings — global, so one cache key for every market. The live page polls
 * this every 5s so a switch shows up within seconds of Studio or the Mux
 * webhook flipping it, without every open tab hitting Sanity: the 5s cache
 * means Sanity sees about one request per 5s however many people are
 * watching. Read from the live API (no CDN) so the cache is the only lag.
 * See docs/live-streaming.md.
 */

export interface LiveStatus {
  isLive: boolean
  liveSource: 'mux' | 'youtube'
  muxPlaybackId: string | null
  youtubeUrl: string | null
}

export default defineSwitchableCachedHandler(
  async (event): Promise<LiveStatus> => {
    const { sanity } = useRuntimeConfig(event).public
    const client = createClient({
      projectId: sanity.projectId,
      dataset: sanity.dataset,
      apiVersion: sanity.apiVersion,
      useCdn: false,
    })

    // Older settings predate the source picker, so they mean Mux.
    return client.fetch(`*[_type == "siteSettings"][0]{
      "isLive": isLive == true,
      "liveSource": coalesce(liveSource, "mux"),
      muxPlaybackId,
      youtubeUrl
    }`)
  },
  {
    maxAge: 5,
    swr: true,
    getKey: () => 'live-status',
  },
)
