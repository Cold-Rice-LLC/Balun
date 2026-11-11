/**
 * Market confirmation prompt: UI state only. It opens when the visitor's
 * detected country differs from the market in the URL (someone in Germany
 * landing on /en-us), and either answer closes it for good.
 *
 * Hand-off point for the edge team (see docs/market-prompt.md). The edge
 * reads the request's geo-IP and sets GEO_COOKIE to the ISO 3166-1 alpha-2
 * country (`DE`, `GB`). It must not be HttpOnly, because only the browser
 * reads it: the prompt is decided after mount, so the cached HTML shell stays
 * geo-agnostic (docs/geo-and-access-strategy.md §3) and never varies by
 * country.
 *
 * `?geo=de` stands in for the cookie in dev, and on a deploy with
 * NUXT_PUBLIC_GEO_OVERRIDE=true (beta, never production).
 */
export const GEO_COOKIE = 'balun-geo-country'
const CONFIRMED_COOKIE = 'balun-market-confirmed'

export const useMarketPrompt = () => {
  const market = useMarket()
  const route = useRoute()
  const allowOverride = import.meta.dev || useRuntimeConfig().public.geoOverride
  const geoCookie = useCookie<string | null>(GEO_COOKIE, { readonly: true })
  // Set by either answer, so switching from US to GB while in Germany doesn't
  // prompt again on the new market's page. Lasts a month, so a returning
  // visitor isn't asked every visit.
  const confirmed = useCookie<boolean>(CONFIRMED_COOKIE, {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })

  // false on the server and during hydration, so SSR never renders it.
  const mounted = useState('market-prompt-mounted', () => false)
  onMounted(() => {
    mounted.value = true
  })

  const detected = computed(() => {
    const override = allowOverride ? route.query.geo : null
    const value = (typeof override === 'string' ? override : geoCookie.value) ?? ''
    return /^[a-z]{2}$/i.test(value) ? value.toUpperCase() : null
  })

  const promptOpen = computed(
    () => mounted.value && !confirmed.value && detected.value !== null && detected.value !== market.value.country,
  )

  const confirm = () => {
    confirmed.value = true
  }

  return { detected, promptOpen, confirm }
}
