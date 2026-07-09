/**
 * The active market/language, derived from the locale URL prefix — the single
 * source of truth for localization (see docs/shopify-and-localization-strategy.md).
 *
 * Locale codes are `{lang}-{country}` (en-us, en-gb), so:
 *   - `lang`    → selects Sanity language fields (once i18n content lands)
 *   - `country` → the @inContext country for Shopify Markets pricing, and
 *                 the $market param for market-audience content filters
 *
 * Reactive: switching locale (market switcher / navigation) updates everything
 * derived from it, including product refetches.
 */
export const useMarket = () => {
  const { locale } = useI18n()

  return computed(() => {
    const [lang = 'en', country = 'us'] = locale.value.split('-')
    return {
      locale: locale.value,
      lang,
      country: country.toUpperCase(),
      market: country.toLowerCase(),
    }
  })
}
