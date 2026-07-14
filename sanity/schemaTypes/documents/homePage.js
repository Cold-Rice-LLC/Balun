import {HomeIcon} from '@sanity/icons'
import {MARKETS} from '../../../locales.mjs'

// Market audience options from the repo-root shared module (single source of
// truth for markets/languages — see docs/adding-a-market.md). Values are the
// lowercase country code useMarket().market produces and $market matches on.
const MARKET_OPTIONS = MARKETS.map(({id, title}) => ({title, value: id}))

export default {
  name: 'homePage',
  type: 'document',
  title: 'Home Page',
  icon: HomeIcon,
  // Not a singleton: one default (no market) + optional per-market overrides.
  // The home query resolves to the market's page if it exists, else the default
  // (docs/shopify-and-localization-strategy.md §3, document-level Pattern B).
  fields: [
    {
      name: 'market',
      type: 'string',
      title: 'Market',
      description:
        'Leave empty for the DEFAULT home page (shown in any market without its own). Pick a market to build a page that overrides the default for that market only.',
      options: {list: MARKET_OPTIONS, layout: 'radio'},
      // Uniqueness so the selection query resolves to exactly one page: at most
      // one default (no market) and one page per market.
      validation: (Rule) =>
        Rule.custom(async (market, context) => {
          const {document, getClient} = context
          if (!document) return true
          const client = getClient({apiVersion: '2024-10-01'})
          const publishedId = document._id.replace(/^drafts\./, '')
          const count = await client.fetch(
            `count(*[
              _type == "homePage"
              && !(_id in [$draft, $published])
              && (market == $market || (!defined(market) && !defined($market)))
            ])`,
            {draft: `drafts.${publishedId}`, published: publishedId, market: market ?? null},
          )
          if (count > 0) {
            return market
              ? `A home page for "${market.toUpperCase()}" already exists.`
              : 'A default home page already exists.'
          }
          return true
        }),
    },
    {
      name: 'modules',
      type: 'array',
      title: 'Modules',
      description: 'Page builder — add and reorder modules to compose the page.',
      of: [{type: 'moduleProductGrid'}, {type: 'moduleFeaturedProduct'}],
    },
  ],
  preview: {
    select: {market: 'market', modules: 'modules'},
    prepare({market, modules}) {
      const count = modules?.length ?? 0
      return {
        title: market ? `Home — ${market.toUpperCase()}` : 'Home — Default',
        subtitle: `${count} module${count === 1 ? '' : 's'}`,
      }
    },
  },
}
