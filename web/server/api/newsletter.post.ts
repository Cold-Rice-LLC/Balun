/**
 * Newsletter signup: POST /api/newsletter
 * Body: { email, website, elapsed, locale } — see EmailSignup.vue.
 *
 * Subscribes the address to the Klaviyo newsletter list through the
 * server-side bulk subscribe job, so the private key never reaches the
 * browser. Double opt-in is a setting on the list, not this call: with it on
 * (the default) Klaviyo emails a confirmation and only lists the address once
 * it's clicked. The visitor's locale goes into the consent record's
 * `custom_source` — the subscribe job doesn't take profile properties.
 *
 * Spam guards. A tripped guard returns the same {ok: true} as a real signup,
 * so a bot can't tell what caught it:
 * - Honeypot: `website` is hidden from people; anything in it came from a bot
 *   filling every field.
 * - Fill time: `elapsed` is ms since the form rendered (client-measured, so a
 *   soft signal); under MIN_FILL_MS is a script, not a person.
 * - Per-IP rate limit: RATE.limit signups per window (see rateLimit).
 * - Strict email check (a 400, so a person with a typo gets told).
 *
 * See docs/newsletter.md.
 */

const KLAVIYO_URL = 'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs'
const KLAVIYO_REVISION = '2026-07-15'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MIN_FILL_MS = 2000
const RATE = { limit: 5, windowMs: 10 * 60 * 1000 }

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown> | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const honeypot = typeof body?.website === 'string' && body.website !== ''
  const tooFast = !(typeof body?.elapsed === 'number' && body.elapsed >= MIN_FILL_MS)
  const locale = typeof body?.locale === 'string' ? body.locale.slice(0, 10) : ''

  if (honeypot || tooFast) return { ok: true }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (!rateLimit(`newsletter:${ip}`, RATE)) return { ok: true }

  // Checked after the guards so an unconfigured site still tells bots nothing.
  const config = useRuntimeConfig(event)
  if (!config.klaviyoPrivateApiKey || !config.klaviyoListId) {
    throw createError({ statusCode: 503, statusMessage: 'Newsletter signup not configured' })
  }

  try {
    await $fetch(KLAVIYO_URL, {
      method: 'POST',
      headers: {
        Authorization: `Klaviyo-API-Key ${config.klaviyoPrivateApiKey}`,
        revision: KLAVIYO_REVISION,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            custom_source: locale ? `Website footer (${locale})` : 'Website footer',
            profiles: {
              data: [
                {
                  type: 'profile',
                  attributes: {
                    email,
                    subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
                  },
                },
              ],
            },
          },
          relationships: { list: { data: { type: 'list', id: config.klaviyoListId } } },
        },
      },
    })
  } catch (error) {
    console.error('[newsletter] Klaviyo subscribe failed', (error as { data?: unknown }).data ?? error)
    throw createError({ statusCode: 502, statusMessage: 'Newsletter signup failed' })
  }

  return { ok: true }
})
