/**
 * The footer signup's second step: POST /api/newsletter-sms
 * Body: { email, token, phone, locale } — see EmailSignup.vue.
 *
 * Adds a phone number with SMS marketing consent to the profile the email
 * step just subscribed. `token` is the one /api/newsletter returned for that
 * email (server/utils/smsSignup.ts), so a number can only be attached to an
 * address that was just signed up here, within half an hour. The profile
 * carries the email without an email subscription, which links the number to
 * it and leaves the email consent alone.
 *
 * The phone is read in the visitor's market ("07700 900123" in /en-gb) and
 * sent in E.164. A number outside the SMS markets is a 400, so the form can
 * tell the person. Klaviyo stores the consent with `custom_source`; the
 * disclosure they agreed to is the `newsletter.smsTerms` string.
 *
 * See docs/newsletter.md.
 */

const RATE = { limit: 5, windowMs: 10 * 60 * 1000 }

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown> | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const token = typeof body?.token === 'string' ? body.token : ''
  const phone = typeof body?.phone === 'string' ? body.phone.slice(0, 40) : ''
  const locale = typeof body?.locale === 'string' ? body.locale.slice(0, 10) : ''
  const market = locale.split('-')[1] ?? ''

  const config = useRuntimeConfig(event)
  const countries = smsCountries(config.klaviyoSmsCountries)
  if (!config.klaviyoPrivateApiKey || !config.klaviyoListId || !countries.length) {
    throw createError({ statusCode: 503, statusMessage: 'SMS signup not configured' })
  }

  if (!verifySmsToken(config.klaviyoPrivateApiKey, email, token)) {
    throw createError({ statusCode: 403, statusMessage: 'Signup expired' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (!rateLimit(`newsletter-sms:${ip}`, RATE)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many attempts' })
  }

  const phoneNumber = toE164(phone, market, countries)
  if (!phoneNumber) throw createError({ statusCode: 400, statusMessage: 'Invalid phone number' })

  try {
    await klaviyoPost(config.klaviyoPrivateApiKey, 'profile-subscription-bulk-create-jobs', {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        custom_source: locale ? `Website footer SMS (${locale})` : 'Website footer SMS',
        profiles: {
          data: [
            {
              type: 'profile',
              attributes: {
                email,
                phone_number: phoneNumber,
                subscriptions: { sms: { marketing: { consent: 'SUBSCRIBED' } } },
              },
            },
          ],
        },
      },
      relationships: { list: { data: { type: 'list', id: config.klaviyoListId } } },
    })
  } catch (error) {
    console.error('[newsletter-sms] Klaviyo subscribe failed', (error as { data?: unknown }).data ?? error)
    throw createError({ statusCode: 502, statusMessage: 'SMS signup failed' })
  }

  return { ok: true }
})
