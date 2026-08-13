import {HomeIcon} from '@sanity/icons'
import {marketField, marketPreviewTitle} from '../lib/marketField'

export default {
  name: 'homePage',
  type: 'document',
  title: 'Home Page',
  icon: HomeIcon,
  // Not a singleton: one default (no market) + optional per-market overrides.
  // The home query resolves to the market's page if it exists, else the default
  // (docs/shopify-and-localization-strategy.md §3, document-level Pattern B).
  fields: [
    marketField('homePage'),
    {
      name: 'modules',
      type: 'array',
      title: 'Modules',
      description: 'Page builder — add and reorder modules to compose the page.',
      of: [
        {type: 'moduleProductGrid'},
        {type: 'moduleFeaturedProduct'},
        {type: 'moduleMarquee'},
        {type: 'moduleBigImageLogo'},
        {type: 'moduleBigImageHeadline'},
      ],
    },
  ],
  preview: {
    select: {market: 'market', modules: 'modules'},
    prepare({market, modules}) {
      const count = modules?.length ?? 0
      return {
        title: marketPreviewTitle('Home', market),
        subtitle: `${count} module${count === 1 ? '' : 's'}`,
      }
    },
  },
}
