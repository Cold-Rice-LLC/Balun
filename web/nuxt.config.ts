import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { LOCALES } from '../locales.mjs'

// Page caching is off for a deploy built behind the password gate: a page
// served from Vercel's cache never reaches the basicAuth middleware, so after
// one signed-in visit it would be open to anyone. Also off with
// NUXT_DISABLE_CACHE=true (demos). Both are read at build time, so changing
// either takes a redeploy. See docs/performance-caching.md.
// The site's own source, bundled with its libraries (vite.$client below).
const appDir = fileURLToPath(new URL('./app/', import.meta.url))

const pageCacheOff =
  Boolean(process.env.NUXT_BASIC_AUTH_PASSWORD) || process.env.NUXT_DISABLE_CACHE === 'true'

// With the publish webhook set up (its bypass token is in the build), edits
// re-render their pages the moment they're published, so pages can stay
// cached for 10 minutes, the expiry only a safety net for a missed webhook.
// Without it, 60s bounds how stale an edit can be. See
// server/api/revalidate.post.ts.
const isrBypassToken = process.env.NUXT_ISR_BYPASS_TOKEN ?? ''
const isrExpiration = isrBypassToken ? 600 : 60

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

  // Links prefetch a page's code and cached data (_payload.json) on hover,
  // focus or touch rather than as soon as they scroll into view: a product
  // grid would otherwise fetch a payload per card on every visit, each one a
  // billed edge request, for pages most visitors never open.
  experimental: {
    defaults: {
      nuxtLink: { prefetchOn: { visibility: false, interaction: true } },
    },
  },

  // <mux-player> / <mux-video> are web components (Mux's players), not Vue
  // components to resolve.
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('mux-'),
    },
  },

  vite: {
    plugins: [tailwindcss()],
    // The browser build ships as a few large files instead of one per
    // component: every file is a billed CDN request, and a first visit
    // otherwise fetched 40+ scripts and a dozen stylesheets. One main script
    // (and so one stylesheet) for the app and its libraries — together, since
    // apart they import each other and Rollup can't order a circular pair —
    // plus Mux's player and the intro's physics in files of their own. (Not
    // cssCodeSplit: false: Nuxt then links no stylesheet at all.) See
    // docs/performance-caching.md.
    $client: {
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (
                /node_modules\/(hls\.js|@mux|mux-embed|media-chrome|custom-media-element|media-tracks|castable-video)/.test(
                  id,
                )
              )
                return 'mux'
              if (id.includes('node_modules/matter-js')) return 'intro'
              if (id.includes('node_modules') || id.startsWith(appDir)) return 'main'
            },
          },
        },
      },
    },
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
    // Server-only (NUXT_BASIC_AUTH_USER / NUXT_BASIC_AUTH_PASSWORD): a set
    // password puts the whole site behind HTTP basic auth (pre-launch /
    // staging). Empty password = no gate.
    basicAuthUser: 'balun',
    basicAuthPassword: '',
    // Server-only (NUXT_DISABLE_CACHE=true): the cached Shopify routes
    // (/api/products, /api/product) skip their SWR cache and hit Shopify on
    // every request — for demos where prices/stock must update instantly.
    // Pair with NUXT_PUBLIC_SANITY_USE_CDN=false for live Sanity content.
    // Leave off in normal traffic: it removes the drop-day shield. See
    // docs/performance-caching.md.
    disableCache: false,
    // Server-only: the supported locale codes, for routes that take
    // ?locale= (server/utils/localeParams.ts). Passed through here because
    // locales.mjs sits outside web/, where the dev server can't import it.
    localeCodes: LOCALES.map(({ code }) => code),
    // Server-only (NUXT_SANITY_WEBHOOK_SECRET / NUXT_ISR_BYPASS_TOKEN): the
    // publish webhook verifies Sanity's signature with the one and asks
    // Vercel to re-render pages with the other. Both empty = the route
    // answers 503. See server/api/revalidate.post.ts.
    sanityWebhookSecret: '',
    isrBypassToken,
    // Server-only (NUXT_SANITY_PREVIEW_TOKEN): a Viewer token that lets
    // ?preview=true renders read drafts (plugins/preview.server.ts). Set it
    // only on a cache-off deploy (staging) and in dev. See docs/preview.md.
    sanityPreviewToken: '',
    // Server renders read Sanity's live API, not its CDN: with pages cached
    // they're rare, and a render triggered by a publish must not pick up the
    // CDN's copy from before it. Browsers keep the CDN (sanity.useCdn below).
    sanity: { useCdn: false },
    public: {
      // Overridden by NUXT_PUBLIC_SHOPIFY_STORE_DOMAIN / NUXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN.
      // Storefront tokens are public-safe (read-only storefront + cart scope).
      // Empty token = server falls back to mock.shop for local dev.
      shopifyStoreDomain: '',
      shopifyStorefrontAccessToken: '',
      shopifyApiVersion: '2026-04',
      // NUXT_PUBLIC_GEO_OVERRIDE=true (beta/staging only): ?geo=de stands in
      // for the edge's geo cookie, so the market prompt can be tested on a
      // deploy. Always on in dev. See docs/market-prompt.md.
      geoOverride: false,
    },
  },

  // Public, read-only config — published content needs no token.
  sanity: {
    projectId: 'pful3cpt',
    dataset: 'production',
    // The CDN serves the last published build, so Studio edits can take a
    // minute to appear — fine (and cheaper) in production, but it makes
    // authoring feel broken. $development below opts local dev out; any
    // deploy (staging included) can too with NUXT_PUBLIC_SANITY_USE_CDN=false.
    useCdn: true,
    apiVersion: '2024-10-01',
    // The module defaults to `raw`, which returns drafts alongside published
    // documents once a token is in play. Only the preview plugin widens it.
    perspective: 'published',
  },

  // Production builds only (`nuxt dev` renders every request). Every page is
  // rendered once and served from Vercel's edge (ISR) for isrExpiration, then
  // regenerated in the background while the stale copy keeps serving — so a
  // traffic spike runs a handful of functions, not one per visitor. Pages
  // also get their data as a cached _payload.json, so moving between pages
  // reads Vercel's cache instead of each browser querying Sanity.
  // allowQuery: [] keys the cache on the path alone (Vercel's ISR hands the
  // function the bare path anyway), so ?fbclid= / ?utm_ links don't each
  // force a fresh render. The feed is the exception — it renders by
  // ?filter=, which ISR would drop — so it's cached by Vercel's CDN on the
  // full URL instead, through s-maxage. API routes set their own caching.
  $production: {
    routeRules: {
      // The build's code, fonts and images may be served from another host
      // (NUXT_APP_CDN_URL, see docs/performance-caching.md), and module
      // scripts and fonts load cross-origin only with CORS.
      '/_nuxt/**': { headers: { 'access-control-allow-origin': '*' } },
      ...(pageCacheOff
        ? {}
        : {
            '/**': { isr: { expiration: isrExpiration, allowQuery: [] } },
            // Spelled out per locale: a `/*/feed` wildcard reaches Vercel's
            // header routes as a literal `*`, and `/feed/**` alone misses the
            // bare landing.
            ...Object.fromEntries(
              LOCALES.flatMap(({ code }) => [`/${code}/feed`, `/${code}/feed/**`]).map((path) => [
                path,
                {
                  isr: false,
                  headers: {
                    'cache-control': 'public, s-maxage=60, stale-while-revalidate=600',
                  },
                },
              ]),
            ),
            '/api/**': { isr: false },
          }),
    },
  },

  hooks: {
    // Nuxt preloads every asset that code loaded on each page imports, which
    // would fetch the intro's artwork on every visit. The intro preloads its
    // own pieces, only when it's about to play (components/home/Intro.vue).
    'build:manifest': (manifest) => {
      for (const chunk of Object.values(manifest)) {
        chunk.assets = chunk.assets?.filter((asset) => !asset.endsWith('.svg'))
      }
    },
  },

  // Vercel re-renders a cached page on request when this token comes with it
  // (the publish webhook). Baked into the build's page cache config.
  nitro: {
    vercel: { config: { bypassToken: isrBypassToken || undefined } },
  },

  // Applied only under `nuxt dev`; production builds keep the values above.
  $development: {
    sanity: {
      useCdn: false,
    },
  },
})
