/**
 * Live Now, what the stream plays and this locale's live page location label,
 * from the edge-cached /api/live-status. Keyed per locale, so the nav and the
 * live page share one copy (and one refresh). Neither refreshes on its own
 * account: the caller decides when (the nav on activity, the live page with
 * usePoll).
 */
export const useLiveStatus = () => {
  const market = useMarket()
  const locale = computed(() => market.value.locale)

  return useFetch('/api/live-status', {
    key: computed(() => `live-status-${locale.value}`),
    query: { locale },
  })
}
