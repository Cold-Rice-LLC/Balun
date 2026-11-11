/**
 * Cookie consent — UI state only. The notice (CookieNotice) shows while no
 * choice has been made; either button records the choice and closes it.
 *
 * Hand-off point for the consent implementation: persist the choice (a
 * cookie read here on SSR, so a returning visitor never sees the notice
 * flash) and gate the non-technical scripts on `choice === 'all'`. Nothing
 * is stored yet — the notice returns on every full page load.
 */
export type CookieChoice = 'technical' | 'all'

export const useCookieConsent = () => {
  const choice = useState<CookieChoice | null>('cookie-choice', () => null)

  const noticeOpen = computed(() => choice.value === null)

  const accept = (value: CookieChoice) => {
    choice.value = value
  }

  return { choice, noticeOpen, accept }
}
