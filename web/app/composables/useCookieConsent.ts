/**
 * Cookie consent — UI state only. The notice (CookieNotice) shows while no
 * choice has been made; either button records the choice and closes it.
 *
 * The choice lives in CONSENT_COOKIE for one visit, like the home intro: a
 * visit ends after 30 minutes without a page view, so every page view renews
 * the cookie and the notice returns on the next visit's first load.
 *
 * The pages are edge-cached, so SSR never varies on the cookie: the notice
 * is decided after mount, the same way MarketPrompt is.
 *
 * Hand-off point for the consent implementation: give the choice a real
 * lifetime and gate the non-technical scripts on `choice === 'all'`.
 */
export type CookieChoice = 'technical' | 'all'

const CONSENT_COOKIE = 'balun-cookie-choice'
const CONSENT_COOKIE_MAX_AGE = 30 * 60

export const useCookieConsent = () => {
  const choice = useCookie<CookieChoice | null>(CONSENT_COOKIE, {
    maxAge: CONSENT_COOKIE_MAX_AGE,
    sameSite: 'lax',
    default: () => null,
  })

  // false on the server and during hydration, so SSR never renders it.
  const mounted = useState('cookie-notice-mounted', () => false)
  onMounted(() => {
    mounted.value = true
  })

  const noticeOpen = computed(() => mounted.value && !choice.value)

  const accept = (value: CookieChoice) => {
    choice.value = value
  }

  // Extends the visit. useCookie only writes on a change, so this sets it
  // directly. Call on every page view.
  const renew = () => {
    if (choice.value) {
      document.cookie = `${CONSENT_COOKIE}=${choice.value}; max-age=${CONSENT_COOKIE_MAX_AGE}; path=/; samesite=lax`
    }
  }

  return { choice, noticeOpen, accept, renew }
}
