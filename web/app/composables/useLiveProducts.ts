import type { MaybeRefOrGetter } from 'vue'

/**
 * Live, market-priced data for a page's product cards: fetches `gids` in one
 * batch (useShopifyProducts — also revalidates on remount) and returns a
 * gid → live product map for the cards' price/availability.
 *
 * The map reads the shared catalog (useLiveCatalog) rather than the fetch
 * result: fresher surfaces (PDP, quick add) feed the same catalog, so a
 * product this visitor just saw sell out can't reappear available, and
 * back-navs paint the last known data while the refetch lands.
 */
export const useLiveProducts = (gids: MaybeRefOrGetter<string[]>) => {
  useShopifyProducts(gids)

  const { byGid: catalog } = useLiveCatalog()
  return computed(() => {
    const map: Record<string, unknown> = {}
    for (const gid of toValue(gids)) {
      const live = catalog.value[gid]
      if (live) map[gid] = live
    }
    return map
  })
}
