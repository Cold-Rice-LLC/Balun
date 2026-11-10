import type { H3Event } from 'h3'

/**
 * A cached route's `?locale=` (en-us, es-us…) as the GROQ $market/$lang
 * pair, the same split useMarket makes in the app. Only supported locales
 * get through: each one is a cache entry, so arbitrary values must not mint
 * new ones (or reach Sanity).
 */
export const localeParams = (event: H3Event) => {
  const locale = String(getQuery(event).locale ?? '')
  if (!useRuntimeConfig(event).localeCodes.includes(locale)) throw createError({ statusCode: 400, statusMessage: 'Unknown locale' })
  const [lang, market] = locale.split('-') as [string, string]
  return { locale, lang, market }
}
