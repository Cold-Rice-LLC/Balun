/**
 * A market-scoped singleton page's Sanity doc (home, info, live): $market
 * selects the market's page or the default, $lang resolves the translated
 * fields inside it. Keyed by both so each combo caches its own shell, and
 * switching either refetches in place. Await it like useAsyncData.
 */
export const useMarketPage = (name: string, query: string) => {
  const sanity = useSanity()
  const market = useMarket()

  return useAsyncData(
    () => `${name}-${market.value.market}-${market.value.lang}`,
    () => sanity.fetch(query, { market: market.value.market, lang: market.value.lang }),
    { watch: [() => market.value.market, () => market.value.lang] },
  )
}
