import type { MaybeRefOrGetter } from 'vue'

/**
 * Live Shopify detail data (variants/options/price/images) for one product,
 * via the cached /api/product route. PDP counterpart of useShopifyProducts —
 * same contract:
 *
 * - `server: false`: prices vary by country and must never bake into the
 *   SSR'd shell (cached once per locale URL). The buy box hydrates client-side.
 * - Country comes from the URL market prefix (useMarket); switching market
 *   refetches in the new currency automatically.
 * - `data.value.product === null` after load means "not sold in this market
 *   or unknown handle" — render the unavailable state, not an error.
 *
 * `options` forwards to useFetch — e.g. quick-add passes { immediate: false }
 * because its handle is empty until a product is picked (an immediate fetch
 * would 400); reactive query changes still trigger fetches afterwards.
 */
export const useShopifyProduct = (
  handle: MaybeRefOrGetter<string>,
  options: Record<string, unknown> = {},
) => {
  const market = useMarket()
  const country = computed(() => market.value.country)
  // Shopify LanguageCode (EN/ES) from the URL's language half — returns
  // translated strings when the store has them (Translate & Adapt).
  const language = computed(() => market.value.lang.toUpperCase())

  return useFetch('/api/product', {
    query: { handle: computed(() => toValue(handle)), country, language },
    server: false,
    ...options,
  })
}
