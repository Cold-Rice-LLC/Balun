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
 */
export const useShopifyProduct = (handle: MaybeRefOrGetter<string>) => {
  const market = useMarket()
  const country = computed(() => market.value.country)

  return useFetch('/api/product', {
    query: { handle: computed(() => toValue(handle)), country },
    server: false,
  })
}
