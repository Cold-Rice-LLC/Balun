/**
 * Klaviyo's server-side API, with the private key from runtime config (never
 * sent to the browser). Used by the newsletter and back-in-stock routes;
 * each checks the key is set first and answers 503 when it isn't.
 */
const KLAVIYO_API = 'https://a.klaviyo.com/api'
const KLAVIYO_REVISION = '2026-07-15'

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const klaviyoPost = (privateKey: string, path: string, data: unknown) =>
  $fetch(`${KLAVIYO_API}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${privateKey}`,
      revision: KLAVIYO_REVISION,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body: { data },
  })
