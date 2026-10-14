import { siteSettingsQuery } from '~/utils/queries'

// Shared site-settings fetch, keyed by language (the meta description is
// translated). useAsyncData dedupes by key, so any number of components can
// call this and share a single fetch/payload. Add new settings fields to
// siteSettingsQuery in utils/queries.ts.
export const useSiteSettings = () => {
  const sanity = useSanity()
  const market = useMarket()

  return useAsyncData(
    () => `site-settings-${market.value.lang}`,
    () => sanity.fetch(siteSettingsQuery, { lang: market.value.lang }),
    { watch: [() => market.value.lang] },
  )
}
