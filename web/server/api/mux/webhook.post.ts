import { createClient } from '@sanity/client'

/**
 * Mux webhook receiver: POST /api/mux/webhook
 *
 * Mux calls this as the live stream changes state. `video.live_stream.active`
 * (encoder connected and video flowing) turns Site Settings' `isLive` on;
 * `video.live_stream.idle` (stream ended, reconnect window expired) turns it
 * off. Everything else is acknowledged and ignored. The stream is global
 * (one streamer, every market), so it's matched by Site Settings'
 * `muxLiveStreamId` — draft included, so the Studio doesn't show a stale
 * toggle.
 *
 * Deliveries are rejected without a valid signature (verifyMuxSignature).
 * See docs/live-streaming.md.
 */

const LIVE_BY_EVENT: Record<string, boolean> = {
  'video.live_stream.active': true,
  'video.live_stream.idle': false,
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.muxWebhookSecret || !config.sanityWriteToken) {
    throw createError({ statusCode: 503, statusMessage: 'Mux webhook not configured' })
  }

  const raw = (await readRawBody(event, 'utf8')) ?? ''
  if (!verifyMuxSignature(getHeader(event, 'mux-signature') ?? '', raw, config.muxWebhookSecret)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid Mux signature' })
  }

  const payload = JSON.parse(raw) as { type?: string; data?: { id?: string } }
  const isLive = LIVE_BY_EVENT[payload.type ?? '']
  const streamId = payload.data?.id
  if (isLive === undefined || !streamId) return { ok: true, handled: false }

  const sanity = createClient({
    projectId: config.public.sanity.projectId,
    dataset: config.public.sanity.dataset,
    apiVersion: config.public.sanity.apiVersion,
    token: config.sanityWriteToken,
    useCdn: false,
  })
  const ids: string[] = await sanity.fetch(
    `*[_type == "siteSettings" && muxLiveStreamId == $streamId]._id`,
    { streamId },
    { perspective: 'raw' },
  )
  if (!ids.length) return { ok: true, handled: false, reason: 'site settings do not name this stream' }

  const transaction = sanity.transaction()
  for (const id of ids) transaction.patch(id, { set: { isLive } })
  await transaction.commit()

  return { ok: true, handled: true, isLive, documents: ids }
})
