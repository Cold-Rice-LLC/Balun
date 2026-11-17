import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * The footer's second step: after an email signup, an offer to add a phone
 * number for texts. See docs/newsletter.md.
 *
 * Only an email the newsletter route just took can get a phone number added,
 * so nobody can attach a number to someone else's profile by posting their
 * address. That route hands back a short-lived token (an HMAC of the email and
 * an expiry), and the SMS route requires it.
 */
const TOKEN_TTL_MS = 30 * 60 * 1000

const sign = (secret: string, email: string, expires: number) =>
  createHmac('sha256', secret).update(`sms-signup:${email}:${expires}`).digest('hex')

export const signSmsToken = (secret: string, email: string, now = Date.now()) => {
  const expires = now + TOKEN_TTL_MS
  return `${expires}.${sign(secret, email, expires)}`
}

export const verifySmsToken = (secret: string, email: string, token: string, now = Date.now()) => {
  const [expiresPart, mac] = token.split('.')
  const expires = Number(expiresPart)
  if (!mac || !Number.isFinite(expires) || expires < now) return false
  const expected = sign(secret, email, expires)
  return mac.length === expected.length && timingSafeEqual(Buffer.from(mac), Buffer.from(expected))
}

/**
 * The markets with SMS set up in Klaviyo (NUXT_KLAVIYO_SMS_COUNTRIES, e.g.
 * "us,gb"). Empty means no SMS step anywhere.
 */
export const smsCountries = (setting: string) =>
  setting
    .split(',')
    .map((country) => country.trim().toLowerCase())
    .filter(Boolean)

// Country code, the number's national form, and what a valid mobile number
// looks like in E.164 digits (no +). GB only takes mobiles (07…).
const NUMBERING: Record<string, { dial: string; valid: RegExp }> = {
  us: { dial: '1', valid: /^1[2-9]\d{2}[2-9]\d{6}$/ },
  gb: { dial: '44', valid: /^447\d{9}$/ },
}

/**
 * A number as typed ("(212) 555-0123", "07700 900123", "+44 7700…") in E.164
 * (Klaviyo's required format), or null if it isn't a mobile number in one of
 * `countries`. Numbers without a + are read in the visitor's own market.
 */
export const toE164 = (input: string, market: string, countries: string[]) => {
  const international = input.trim().startsWith('+')
  let digits = input.replace(/\D/g, '')
  const local = NUMBERING[market]
  if (!international && local) {
    if (digits.startsWith('0')) digits = local.dial + digits.slice(1)
    else if (!digits.startsWith(local.dial)) digits = local.dial + digits
  }
  const ok = countries.some((country) => NUMBERING[country]?.valid.test(digits))
  return ok ? `+${digits}` : null
}
