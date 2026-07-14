/**
 * Derives the two localization switchers from the i18n locale list, keeping the
 * axes separate (see docs/shopify-and-localization-strategy.md §2):
 *   - markets   → one entry per country; switching keeps the current language
 *                 if that combo exists, else falls back to the country's first
 *                 locale (so es-us → gb lands on en-gb, not a missing es-gb).
 *   - languages → the languages available *for the current country* only, so we
 *                 never offer an unsupported {lang}-{country} combo.
 *
 * Locale metadata (country/lang/marketName/langName) lives on the i18n.locales
 * entries in nuxt.config.
 */
export const useLocaleNav = () => {
  const { locale, locales } = useI18n()
  const switchLocalePath = useSwitchLocalePath()

  const current = computed(() => locales.value.find((l) => l.code === locale.value))

  const markets = computed(() => {
    const byCountry = new Map<string, any[]>()
    for (const l of locales.value) {
      if (!byCountry.has(l.country)) byCountry.set(l.country, [])
      byCountry.get(l.country)!.push(l)
    }
    return [...byCountry.entries()].map(([country, group]) => {
      // Prefer staying in the current language within the target market.
      const target = group.find((l) => l.lang === current.value?.lang) ?? group[0]
      return {
        country,
        name: target.marketName,
        code: target.code,
        active: country === current.value?.country,
      }
    })
  })

  const languages = computed(() =>
    locales.value
      .filter((l) => l.country === current.value?.country)
      .map((l) => ({
        lang: l.lang,
        name: l.langName,
        code: l.code,
        active: l.code === locale.value,
      })),
  )

  return { markets, languages, switchLocalePath }
}
