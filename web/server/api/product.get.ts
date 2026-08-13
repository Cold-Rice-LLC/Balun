/**
 * Single-product fetch for the PDP: GET /api/product?handle=slide-03&country=US
 *
 * Richer projection than /api/products (full variants for the size picker,
 * images) — keep the two routes separate so listing payloads stay lean.
 * Product copy is NOT fetched here: the PDP renders the Sanity `body` field,
 * so Shopify's descriptionHtml would be an unread HTML blob on every request.
 * Same caching contract as /api/products but a tighter window: this is the
 * buy surface, where availability should read as close to live as the cache
 * allows, so the SWR cache (keyed by handle+country) holds 15s instead of
 * 60s. Drop traffic on a single product still collapses to ~4 Shopify
 * requests/min per market (see docs/performance-caching.md).
 *
 * `product: null` means Shopify doesn't sell this product to the requested
 * country (or the handle is unknown) — the PDP renders its unavailable state,
 * it is NOT a 404 (the editorial shell may still exist).
 */

const PRODUCT_QUERY = /* GraphQL */ `
  query ($handle: String!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      availableForSale
      options {
        name
        optionValues {
          name
        }
      }
      images(first: 12) {
        nodes {
          url
          altText
          width
          height
        }
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
      variants(first: 100) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          image {
            url
            altText
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

interface StorefrontImage {
  url: string
  altText: string | null
  width?: number
  height?: number
}

export interface StorefrontVariant {
  id: string
  title: string
  availableForSale: boolean
  price: StorefrontMoney
  compareAtPrice: StorefrontMoney | null
  selectedOptions: { name: string; value: string }[]
  image: StorefrontImage | null
}

export interface StorefrontProductDetail {
  id: string
  title: string
  handle: string
  availableForSale: boolean
  options: { name: string; optionValues: { name: string }[] }[]
  images: { nodes: StorefrontImage[] }
  priceRange: {
    minVariantPrice: StorefrontMoney
    maxVariantPrice: StorefrontMoney
  }
  variants: { nodes: StorefrontVariant[] }
}

export default defineCachedEventHandler(
  async (event) => {
    const { handle: rawHandle, country: rawCountry, language: rawLanguage } = getQuery(event)

    const handle = String(rawHandle ?? '').trim()
    if (!handle) {
      throw createError({ statusCode: 400, statusMessage: 'handle query param is required' })
    }

    const country = /^[A-Za-z]{2}$/.test(String(rawCountry ?? ''))
      ? String(rawCountry).toUpperCase()
      : 'US'

    // @inContext language: translated strings when the store has them
    // (Translate & Adapt), default language otherwise.
    const language = /^[A-Za-z]{2}$/.test(String(rawLanguage ?? ''))
      ? String(rawLanguage).toUpperCase()
      : 'EN'

    const data = await storefrontQuery<{ product: StorefrontProductDetail | null }>(
      PRODUCT_QUERY,
      { handle, country, language },
    )

    return {
      country,
      language,
      product: data.product,
    }
  },
  {
    // Tighter than /api/products' 60s: this feeds the buy box and the
    // failed-add recovery refetch, so a sell-out should stop reading as
    // available within ~15s. Upstream cost is still tiny (~4 requests/min
    // per handle+market, per instance).
    maxAge: 15,
    swr: true,
    getKey: (event) => {
      const { handle, country, language } = getQuery(event)
      return `product:${country ?? 'US'}:${language ?? 'EN'}:${handle ?? ''}`
    },
  },
)
