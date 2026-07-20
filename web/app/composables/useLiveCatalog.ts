/**
 * Session-wide "freshest known" live product data, keyed by market country
 * THEN Shopify product gid — the client-side stale-while-revalidate layer
 * over the cached API routes (see docs/performance-caching.md).
 *
 * Every live fetch reports what it learned here: the batch route inside
 * useShopifyProducts, and the PDP/quick-add detail fetches at their call
 * sites (where the gid is known even for a null response). Listing surfaces
 * render FROM the catalog instead of their own fetch result, which buys:
 *
 * 1. No flicker on back-nav: pages force a background refetch on remount
 *    (bounding staleness to the server cache's ~60s window) while the last
 *    known data keeps painting until the fresh response lands.
 * 2. Cross-surface consistency: whatever the user just saw is what every
 *    surface shows — a product seen sold out on the PDP can't reappear
 *    available on a home card.
 *
 * Per-market buckets are what make a market switch atomic: price and
 * availability differ by country (Shopify Markets), so the new market's
 * responses land in their own bucket instead of overwriting entries the
 * still-visible outgoing page is rendering. The old page keeps painting its
 * own market's prices until the new page mounts and reads the new bucket —
 * and switching back repaints instantly from cache.
 *
 * `null` is a real value ("fetched, and not sold in this market" — Shopify
 * Markets masking) and overwrites the entry. Non-null reports merge over the
 * previous entry, so a detail response without featuredImage keeps the
 * batch's image.
 */

// The lean listing shape (what /api/products returns / product cards read).
type LiveCatalogEntry = Record<string, unknown>

const LEAN_FIELDS = ['id', 'title', 'handle', 'availableForSale', 'featuredImage', 'priceRange']

export const useLiveCatalog = () => {
  // country ('US', 'GB') → gid → entry
  const buckets = useState<Record<string, Record<string, LiveCatalogEntry | null>>>(
    'live-catalog',
    () => ({}),
  )
  const market = useMarket()

  // The current market's gid → entry map. Readers render from this, so what
  // they see always matches the URL's market.
  const byGid = computed(() => buckets.value[market.value.country] ?? {})

  // Project to listing fields so detail responses (variants, images, body…)
  // don't bloat the shared state; absent fields are dropped, not nulled, so
  // the merge below keeps prior values.
  const lean = (product: Record<string, any>) => {
    const entry: LiveCatalogEntry = {}
    for (const key of LEAN_FIELDS) {
      if (product[key] !== undefined) entry[key] = product[key]
    }
    return entry
  }

  // `country` is the market the response was fetched FOR — the API routes
  // echo it back, so pass that rather than reading the current URL: a
  // response landing after a market switch still files into the bucket it
  // belongs to instead of contaminating the new market's.
  const report = (gid: string, product: Record<string, any> | null, country?: string) => {
    if (!gid) return
    const bucket = (buckets.value[country ?? market.value.country] ??= {})
    bucket[gid] = product ? { ...(bucket[gid] ?? {}), ...lean(product) } : null
  }

  return { byGid, report }
}
