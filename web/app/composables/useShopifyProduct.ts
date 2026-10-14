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
 * Every response is reported to the shared catalog (useLiveCatalog), so
 * listing surfaces stay consistent with what the visitor just saw. A
 * loaded-but-null product is real info (masked from this market), but the
 * response can't name its gid — pass `gid` (the caller's known gid for the
 * handle) so that case maps to the right catalog entry.
 *
 * Remaining `options` forward to useFetch — e.g. quick-add passes
 * { immediate: false } because its handle is empty until a product is picked
 * (an immediate fetch would 400); reactive query changes still trigger
 * fetches afterwards.
 */
export const useShopifyProduct = (
  handle: MaybeRefOrGetter<string>,
  { gid, ...options }: { gid?: MaybeRefOrGetter<string | null | undefined> } & Record<string, unknown> = {},
) => {
  const market = useMarket()
  const country = computed(() => market.value.country)
  const language = computed(() => market.value.language)

  const result = useFetch('/api/product', {
    query: { handle: computed(() => toValue(handle)), country, language },
    server: false,
    ...options,
  })

  const { report } = useLiveCatalog()
  watch(result.data, (val) => {
    if (!val) return
    if (val.product?.id) report(val.product.id, val.product, val.country)
    else if (toValue(gid)) report(toValue(gid)!, null, val.country)
  })

  return result
}
