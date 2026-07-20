/**
 * Single source of truth for localization config, shared by the Sanity Studio
 * (sanity.config.js, schema market options) and the Nuxt app (i18n.locales).
 *
 * To add a market or language, edit THIS file (plus Shopify admin for markets)
 * — see docs/adding-a-market.md. Never ship the cartesian product of
 * languages × markets: list only the combos we actually support in COMBOS.
 */

// Content languages. `title` labels the Studio's translation tabs (editor-
// facing); `nativeName` labels the site's language switcher (visitor-facing).
export const LANGUAGES = [
  {id: 'en', title: 'English', nativeName: 'English'},
  {id: 'es', title: 'Spanish', nativeName: 'Español'},
]

// The language whose value every translated field falls back to (and must
// always exist — enforced by schema validation).
export const DEFAULT_LANGUAGE = 'en'

// Markets (countries). `id` is the lowercase ISO country code (`gb`, not `uk`)
// — the GROQ $market param; uppercased it's the Shopify @inContext country.
export const MARKETS = [
  {id: 'us', title: 'United States'},
  {id: 'gb', title: 'United Kingdom'},
]

// Supported {lang}-{country} combos — each becomes a URL prefix (/en-us).
const COMBOS = [
  ['en', 'us'],
  ['en', 'gb'],
  ['es', 'us'],
]

// Nuxt i18n locale entries derived from the combos. The default language shows
// the bare market name; others get "(Native name)" so /en-us and /es-us read
// distinctly in pickers and analytics. `file` points at the UI-string catalog
// (web/i18n/locales/): keyed by LANGUAGE, so en-us and en-gb share en.json —
// adding a language means adding its catalog file alongside the combo here.
export const LOCALES = COMBOS.map(([lang, country]) => {
  const language = LANGUAGES.find((l) => l.id === lang)
  const market = MARKETS.find((m) => m.id === country)
  return {
    code: `${lang}-${country}`,
    language: `${lang}-${country.toUpperCase()}`,
    name:
      lang === DEFAULT_LANGUAGE ? market.title : `${market.title} (${language.nativeName})`,
    file: `${lang}.json`,
    country,
    lang,
    marketName: market.title,
    langName: language.nativeName,
  }
})
