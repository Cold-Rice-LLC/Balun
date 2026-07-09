import type { MaybeRefOrGetter } from 'vue'

/**
 * Live Shopify data (price/availability/title/image) for a list of product
 * GIDs, via the cached /api/products route.
 *
 * Typical use: a page queries Sanity for product docs, maps out their
 * `shopifyGid`s, passes them here, then matches results back by id:
 *
 *   const { data } = useShopifyProducts(gids)
 *   const live = data.value?.products.find(p => p?.id === doc.shopifyGid)
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
 * `gids` is reactive: pass a ref/computed and the fetch re-runs when it changes.
 * Country is hardcoded US until URL market prefixes land (@nuxtjs/i18n phase);
 * then it will come from the route's market segment.
 */
export const useShopifyProducts = (gids: MaybeRefOrGetter<string[]>, country = 'US') => {
  const gidsParam = computed(() => toValue(gids).filter(Boolean).join(','))

  return useFetch('/api/products', {
    query: { gids: gidsParam, country },
    server: false,
  })
}
