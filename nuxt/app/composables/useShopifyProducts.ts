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
  // Shopify LanguageCode (EN/ES) from the URL's language half — returns
  // translated strings when the store has them (Translate & Adapt).
  const language = computed(() => market.value.lang.toUpperCase())

  const result = useFetch('/api/products', {
    query: { gids: gidsParam, country, language },
    server: false,
    // Bypass Nuxt's payload cache: without this, a back-nav remount reuses
    // the session's first response forever (sold-out products keep looking
    // available). Refetching bounds staleness to the server cache's ~60s
    // window, and costs one request to our own cached route — Shopify load
    // is unchanged. Callers render from useLiveCatalog so the last known
    // data keeps painting during the refetch (no flicker).
    getCachedData: () => undefined,
  })

  // Report every response to the shared catalog. The response array mirrors
  // the requested gids (nodes(ids:) preserves order), so a null entry maps
  // back to its gid — that's real information ("not sold in this market"),
  // not an error, and must overwrite a stale "available" entry.
  const { report } = useLiveCatalog()
  watch(result.data, (val) => {
    if (!val) return
    const requested = toValue(gids).filter(Boolean)
    const products = val.products ?? []
    if (requested.length === products.length) {
      requested.forEach((gid, i) => report(gid, products[i] ?? null))
    } else {
      // gids changed while the request was in flight — only trust the ids
      // the response itself carries.
      for (const p of products) if (p?.id) report(p.id, p)
    }
  })

  return result
}
