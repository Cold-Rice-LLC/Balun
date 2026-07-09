/**
 * Batch product fetch: GET /api/products?gids=gid1,gid2&country=US
 *
 * The read path for live commerce data (price/availability/title/image).
 * Pages get product GIDs from Sanity, then call this to merge live data in —
 * see useShopifyProducts + docs/shopify-and-localization-strategy.md.
 *
 * - `nodes(ids:)` fetches every requested product in ONE Shopify round trip.
 * - `@inContext(country:)` makes Shopify return that market's price + currency
 *   (Shopify Markets). This is why prices are never stored/synced anywhere.
 * - Unknown or market-unpublished GIDs come back as null in `products` —
 *   callers treat null as "unavailable here." That's the Markets masking
 *   behavior working as intended, not an error.
 * - Projection is deliberately lean (listing/buy-box fields only). The product
 *   detail page will want its own richer query — don't fatten this one.
 */

const PRODUCTS_QUERY = /* GraphQL */ `
  query ($ids: [ID!]!, $country: CountryCode!) @inContext(country: $country) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        availableForSale
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`

interface StorefrontMoney {
  amount: string
  currencyCode: string
}

export interface StorefrontProduct {
  id: string
  title: string
  handle: string
  availableForSale: boolean
  featuredImage: { url: string; altText: string | null } | null
  priceRange: {
    minVariantPrice: StorefrontMoney
    maxVariantPrice: StorefrontMoney
  }
}

export default defineCachedEventHandler(
  async (event) => {
    const { gids, country: rawCountry } = getQuery(event)

    // Only forward well-formed product GIDs — anything else (junk input,
    // variant GIDs, injection attempts) is silently dropped.
    const ids = String(gids ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.startsWith('gid://shopify/Product/'))

    const country = /^[A-Za-z]{2}$/.test(String(rawCountry ?? ''))
      ? String(rawCountry).toUpperCase()
      : 'US'

    if (!ids.length) {
      return { country, products: [] }
    }

    const data = await storefrontQuery<{ nodes: (StorefrontProduct | null)[] }>(PRODUCTS_QUERY, {
      ids,
      country,
    })

    return {
      country,
      products: data.nodes,
    }
  },
  {
    // The drop-day shield: every visitor requesting the same gids+country
    // within 60s is served from this cache — Shopify sees ~1 request per key
    // per minute no matter how big the traffic spike is.
    // `swr: true` = if the cache is stale, serve the old response instantly
    // and refresh in the background, so a slow/flaky Shopify never blocks
    // visitors at the worst moment.
    maxAge: 60,
    swr: true,
    // Cache key must include country — the same product has different
    // prices/currency/availability per market (@inContext).
    getKey: (event) => {
      const { gids, country } = getQuery(event)
      return `products:${country ?? 'US'}:${gids ?? ''}`
    },
  },
)
