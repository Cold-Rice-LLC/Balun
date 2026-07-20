/**
 * Server-side Shopify Storefront API client (Nitro-only — not importable in components).
 *
 * WHY SERVER-SIDE: product reads go through here (not the client-side
 * useShopifyClient composable) so responses can be cached and shared across
 * visitors — during a drop, thousands of identical browser queries collapse
 * into ~1 upstream Shopify request per cache key. See docs/performance-caching.md.
 * (Cart mutations are the opposite — per-user, uncacheable — so they stay
 * client-side in useShopifyClient.)
 *
 * MOCK FALLBACK: with no token configured (empty NUXT_PUBLIC_SHOPIFY_STOREFRONT_
 * ACCESS_TOKEN), requests go to mock.shop — Shopify's public demo API with the
 * real Storefront schema. Lets anyone run the repo with no credentials.
 * mock.shop ignores @inContext; a real store honors it (Markets pricing/currency).
 *
 * Usage: `const data = await storefrontQuery<Shape>(QUERY, { vars })` from any
 * server route. Throws a 502 H3 error if Shopify returns GraphQL errors.
 */

interface StorefrontErrorItem {
  message: string
}

interface StorefrontResponse<T> {
  data?: T
  errors?: StorefrontErrorItem[]
}

export const storefrontQuery = async <T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> => {
  const config = useRuntimeConfig()
  const { shopifyStoreDomain, shopifyStorefrontAccessToken, shopifyApiVersion } = config.public

  const isMock = !shopifyStorefrontAccessToken
  const url = isMock
    ? 'https://mock.shop/api'
    : `https://${shopifyStoreDomain}/api/${shopifyApiVersion}/graphql.json`

  const response = await $fetch<StorefrontResponse<T>>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(isMock ? {} : { 'X-Shopify-Storefront-Access-Token': shopifyStorefrontAccessToken }),
    },
    body: { query, variables },
  })

  if (response.errors?.length) {
    throw createError({
      statusCode: 502,
      statusMessage: `Storefront API: ${response.errors.map((e) => e.message).join('; ')}`,
    })
  }

  if (!response.data) {
    throw createError({ statusCode: 502, statusMessage: 'Storefront API returned no data' })
  }

  return response.data
}
