import tailwindcss from '@tailwindcss/vite'
import { LOCALES } from '../locales.mjs'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/sanity', '@nuxtjs/i18n'],

  // Market/locale URL prefixes: /{lang}-{country} (e.g. /en-us, /en-gb) is the
  // single source of truth for language AND market — it selects Sanity content
  // and the @inContext country for Shopify pricing. One cached HTML shell per
  // locale; IP is never used to vary content. See
  // docs/shopify-and-localization-strategy.md.
  i18n: {
    // Supported {lang}-{country} combos from the repo-root shared module
    // (single source of truth, also feeds the Studio) — never the cartesian
    // product. `country`/`lang` drive market vs language selection; the *Name
    // fields label the two switchers. See docs/adding-a-market.md.
    locales: LOCALES,
    defaultLocale: 'en-us',
    // Every route carries its locale prefix — no unprefixed variants to
    // fragment the cache or the analytics.
    strategy: 'prefix',
    rootRedirect: 'en-us',
    // No IP/Accept-Language auto-redirects (SEO + user agency) — a suggestion
    // banner comes later per the strategy doc.
    detectBrowserLanguage: false,
  },

  css: ['~/assets/css/global.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    public: {
      // Overridden by NUXT_PUBLIC_SHOPIFY_STORE_DOMAIN / NUXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN.
      // Storefront tokens are public-safe (read-only storefront + cart scope).
      // Empty token = server falls back to mock.shop for local dev.
      shopifyStoreDomain: '',
      shopifyStorefrontAccessToken: '',
      shopifyApiVersion: '2026-04',
    },
  },

  // Public, read-only config — published content needs no token.
  sanity: {
    projectId: 'pful3cpt',
    dataset: 'production',
    // The CDN serves the last published build, so Studio edits can take a
    // minute to appear — fine (and cheaper) in production, but it makes
    // authoring feel broken. $development below opts local dev out.
    useCdn: true,
    apiVersion: '2024-10-01',
  },

  // Applied only under `nuxt dev`; production builds keep the values above.
  $development: {
    sanity: {
      useCdn: false,
    },
  },
})
