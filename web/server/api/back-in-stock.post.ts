/**
 * Back-in-stock signup: POST /api/back-in-stock
 * Body: { email, handle, country, website, elapsed } — see
 * global/BackInStockModal.vue.
 *
 * Asks Klaviyo to email the address when any size (variant) of the product
 * is back in stock: one back-in-stock subscription per variant (Klaviyo's
 * subscriptions are per variant). The variants are looked up here from the
 * handle, in the visitor's market, so the popup works the same from a grid
 * card (which has no variants loaded) as from the PDP, and the browser never
 * chooses which variant ids get subscribed. Klaviyo watches inventory through its
 * Shopify integration and sends through the account's Back in Stock flow;
 * neither is set up here — see docs/back-in-stock.md.
 *
 * Spam guards, as the newsletter route (a tripped guard returns the same
 * {ok: true} as a real signup): honeypot `website`, a minimum fill time
 * (`elapsed`, client-measured), a per-IP rate limit, and a strict email check
 * (a 400, so a person with a typo is told).
 */

const MIN_FILL_MS = 1500
const RATE = { limit: 5, windowMs: 10 * 60 * 1000 }

const VARIANTS_QUERY = /* GraphQL */ `
  query ($handle: String!, $country: CountryCode!) @inContext(country: $country) {
    product(handle: $handle) {
      variants(first: 100) {
        nodes {
          id
        }
      }
    }
  }
`

// Shopify variant GIDs end in the numeric id Klaviyo's catalog uses.
const numericVariantId = (gid: string) => /\/(\d+)$/.exec(gid)?.[1] ?? null

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown> | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const honeypot = typeof body?.website === 'string' && body.website !== ''
  const tooFast = !(typeof body?.elapsed === 'number' && body.elapsed >= MIN_FILL_MS)
  const handle = typeof body?.handle === 'string' ? body.handle.trim().slice(0, 255) : ''
  const { country } = parseMarketQuery({ country: body?.country })

  if (honeypot || tooFast) return { ok: true }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email' })
  }
  if (!handle) throw createError({ statusCode: 400, statusMessage: 'Invalid product' })

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (!rateLimit(`back-in-stock:${ip}`, RATE)) return { ok: true }

  // Checked after the guards so an unconfigured site still tells bots nothing.
  const config = useRuntimeConfig(event)
  if (!config.klaviyoPrivateApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Back in stock not configured' })
  }

  const { product } = await storefrontQuery<{ product: { variants: { nodes: { id: string }[] } } | null }>(
    VARIANTS_QUERY,
    { handle, country },
  )
  const variantIds = (product?.variants.nodes ?? []).map(({ id }) => numericVariantId(id)).filter((id) => id !== null)
  if (!variantIds.length) throw createError({ statusCode: 400, statusMessage: 'Invalid product' })

  const results = await Promise.allSettled(
    variantIds.map((id) =>
      klaviyoPost(config.klaviyoPrivateApiKey, 'back-in-stock-subscriptions', {
        type: 'back-in-stock-subscription',
        attributes: {
          channels: ['EMAIL'],
          profile: { data: { type: 'profile', attributes: { email } } },
        },
        relationships: {
          variant: { data: { type: 'catalog-variant', id: `$shopify:::$default:::${id}` } },
        },
      }),
    ),
  )

  const failed = results.filter((result) => result.status === 'rejected')
  for (const { reason } of failed) {
    console.error('[back-in-stock] Klaviyo subscribe failed', (reason as { data?: unknown }).data ?? reason)
  }
  // Any subscription that went through means they'll hear back; only a
  // total failure is the visitor's problem.
  if (failed.length === results.length) {
    throw createError({ statusCode: 502, statusMessage: 'Back in stock signup failed' })
  }

  return { ok: true }
})
