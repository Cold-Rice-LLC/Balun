import type { MaybeRefOrGetter } from 'vue'

/**
 * Live Shopify data (price/availability/title/image) for a list of product
 * GIDs, via the cached /api/products route.
 *
 * Typical use: a page queries Sanity for product docs (projections expose
 * store.gid as `gid`), passes the gids here, then matches results back by id:
 *
 *   const { data } = useShopifyProducts(gids)
 *   const live = data.value?.products.find(p => p?.id === doc.gid)
 *
 * A null entry in `products` means Shopify didn't return that product
 * (unpublished, deleted, or hidden from the visitor's market) — render an
 * "unavailable" state, don't treat it as an error.
 *
 * `server: false` is deliberate: prices vary by country, so they must NOT be
 * baked into the SSR'd HTML (which is cached once per URL and served to
 * everyone). The shell renders geo-agnostic; this data hydrates client-side —
 * the "buy-box island" in docs/geo-and-access-strategy.md.
 *
 * Reactive: pass a ref/computed for `gids` and the fetch re-runs when it
 * changes — and the country comes from the URL's market prefix (useMarket),
 * so switching market refetches prices in the new currency automatically.
 */
export const useShopifyProducts = (gids: MaybeRefOrGetter<string[]>) => {
  const gidsParam = computed(() => toValue(gids).filter(Boolean).join(','))
  const market = useMarket()
  const country = computed(() => market.value.country)

  return useFetch('/api/products', {
    query: { gids: gidsParam, country },
    server: false,
  })
}
