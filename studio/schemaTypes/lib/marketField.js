import {MARKETS} from '../../../locales.mjs'

// Market audience options from the repo-root shared module (single source of
// truth for markets/languages — see docs/adding-a-market.md). Values are the
// lowercase country code useMarket().market produces and $market matches on.
const MARKET_OPTIONS = MARKETS.map(({id, title}) => ({title, value: id}))

/**
 * The document-level market override field (docs/shopify-and-localization-
 * strategy.md §3, Pattern B): no market = the DEFAULT document, a market set =
 * a whole-document override for that market only. Queries resolve with
 * `(market == $market || !defined(market)) | order(defined(market) desc)[0]`.
 *
 * Validation enforces the uniqueness that selector depends on: at most one
 * default and one document per market — scoped per slug when `scopeToSlug` is
 * set (legalPage, where identity is slug × market).
 */
export const marketField = (type, {scopeToSlug = false} = {}) => ({
  name: 'market',
  type: 'string',
  title: 'Market',
  description:
    'Leave empty for the DEFAULT page (shown in any market without its own). Pick a market to build a page that overrides the default for that market only.',
  options: {list: MARKET_OPTIONS, layout: 'radio'},
  validation: (Rule) =>
    Rule.custom(async (market, context) => {
      const {document, getClient} = context
      if (!document) return true
      // No slug yet = nothing to clash with; the slug field's own isUnique
      // re-checks the (slug, market) pair once it exists.
      const slug = scopeToSlug ? document.slug?.current : null
      if (scopeToSlug && !slug) return true
      const client = getClient({apiVersion: '2024-10-01'})
      const publishedId = document._id.replace(/^drafts\./, '')
      const count = await client.fetch(
        `count(*[
          _type == $type
          && !(_id in [$draft, $published])
          && (market == $market || (!defined(market) && !defined($market)))
          ${scopeToSlug ? '&& slug.current == $slug' : ''}
        ])`,
        {
          type,
          draft: `drafts.${publishedId}`,
          published: publishedId,
          market: market ?? null,
          ...(scopeToSlug ? {slug} : {}),
        },
      )
      if (count > 0) {
        const what = scopeToSlug ? `"/${slug}" page` : 'page'
        return market
          ? `A ${what} for "${market.toUpperCase()}" already exists.`
          : `A default ${what} already exists.`
      }
      return true
    }),
})

// Shared preview title: "Info — GB" / "Info — Default".
export const marketPreviewTitle = (base, market) =>
  market ? `${base} — ${market.toUpperCase()}` : `${base} — Default`
