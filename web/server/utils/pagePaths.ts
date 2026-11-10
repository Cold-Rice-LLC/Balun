import type { H3Event } from 'h3'

// Every page the site serves from Vercel's page cache, per locale, by the
// Sanity document type that feeds it. The feed isn't listed: it's cached by
// URL with a 60s s-maxage, which a purge by path can't reach (see
// nuxt.config.ts routeRules).
const SINGLETON_PATHS: Record<string, string> = {
  homePage: '',
  infoPage: '/info',
  livePage: '/live',
  shopPage: '/products',
}

// Synced on every Shopify price/stock change, but nothing they hold is in a
// cached page (prices load in the browser), so they purge nothing.
const NO_PAGES = new Set(['productVariant', 'feedPost', 'feedPage'])

const allPathsQuery = groq`{
  "products": *[_type == "product" && store.isDeleted != true && defined(store.slug.current)].store.slug.current,
  "legal": *[_type == "legalPage" && defined(slug.current)].slug.current
}`

/**
 * The locale-less paths to purge when a document of `type` (with `slug`, if
 * it has one) is published. Products also refresh the shop, home and live
 * pages, which can show them; anything unrecognised (Site Settings, the nav,
 * a Mux asset) refreshes every page, since it can appear on any of them.
 */
export const pagePathsFor = async (event: H3Event, type?: string, slug?: string) => {
  if (type && NO_PAGES.has(type)) return []
  if (type && type in SINGLETON_PATHS) return [SINGLETON_PATHS[type]!]
  if (type === 'legalPage' && slug) return [`/${slug}`]
  if (type === 'product' && slug) return [`/products/${slug}`, '/products', '', '/live']

  const { products, legal } = await useSanity(event).fetch<{ products: string[]; legal: string[] }>(allPathsQuery)
  return [
    ...Object.values(SINGLETON_PATHS),
    ...products.map((handle) => `/products/${handle}`),
    ...legal.map((page) => `/${page}`),
  ]
}

// Each path in every locale, as both the page and its _payload.json (which
// Vercel caches separately).
export const localizedUrls = (event: H3Event, paths: string[]) =>
  useRuntimeConfig(event).localeCodes.flatMap((locale: string) =>
    paths.flatMap((path) => [`/${locale}${path}`, `/${locale}${path}/_payload.json`]),
  )
