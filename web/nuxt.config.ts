import tailwindcss from '@tailwindcss/vite'
import { LOCALES } from '../locales.mjs'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/sanity', '@nuxtjs/i18n', '@vueuse/nuxt'],

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

  app: {
    head: {
      // The nav logo as the site icon: SVG for modern browsers (light/dark
      // fills via its own media query), .ico fallback, and the iOS home-screen
      // tile (opaque, so it carries the PDP grey behind the logo).
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  css: ['~/assets/css/global.css'],

  // <mux-player> is a web component (the live page's player), not a Vue
  // component to resolve.
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('mux-'),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    // Server-only (NUXT_MUX_WEBHOOK_SECRET / NUXT_SANITY_WRITE_TOKEN): the
    // Mux webhook route verifies signatures with the one and flips the live
    // page's `isLive` with the other. See docs/live-streaming.md.
    muxWebhookSecret: '',
    sanityWriteToken: '',
    // Server-only (NUXT_KLAVIYO_PRIVATE_API_KEY / NUXT_KLAVIYO_LIST_ID): the
    // newsletter route subscribes footer signups to this Klaviyo list. Both
    // empty = the route answers 503 and the form shows its error message.
    // See docs/newsletter.md.
    klaviyoPrivateApiKey: '',
    klaviyoListId: '',
    // Server-only (NUXT_NOINDEX=true on staging): X-Robots-Tag: noindex on
    // every response, so a staging deploy never gets indexed.
    noindex: false,
    // Server-only (NUXT_DISABLE_CACHE=true): the cached Shopify routes
    // (/api/products, /api/product) skip their SWR cache and hit Shopify on
    // every request — for demos where prices/stock must update instantly.
    // Pair with NUXT_PUBLIC_SANITY_USE_CDN=false for live Sanity content.
    // Leave off in normal traffic: it removes the drop-day shield. See
    // docs/performance-caching.md.
    disableCache: false,
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
    // useCdn: true,
    useCdn: false,
    apiVersion: '2024-10-01',
  },

  // Applied only under `nuxt dev`; production builds keep the values above.
  $development: {
    sanity: {
      useCdn: false,
    },
  },
})
