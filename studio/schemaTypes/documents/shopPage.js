import {BasketIcon} from '@sanity/icons'
import {marketField, marketPreviewTitle} from '../lib/marketField'

/**
 * The Shop page (/products): every product the site sells, as a grid in the
 * order picked here — the same cards as the home Product Grid module.
 * Not a singleton: one default (no market) + optional per-market overrides,
 * resolved like the home page (document-level Pattern B).
 */
export default {
  name: 'shopPage',
  type: 'document',
  title: 'Shop Page',
  icon: BasketIcon,
  fields: [
    marketField('shopPage'),
    {
      name: 'products',
      type: 'array',
      title: 'Products',
      description:
        'Pick and order the products. Ones that are draft, archived or deleted in Shopify are skipped automatically.',
      of: [{type: 'reference', to: [{type: 'product'}]}],
      validation: (Rule) => Rule.unique().error('Each product can only appear once.'),
    },
    {
      name: 'seo',
      type: 'seo',
    },
  ],
  preview: {
    select: {market: 'market', products: 'products'},
    prepare({market, products}) {
      const count = products?.length ?? 0
      return {
        title: marketPreviewTitle('Shop', market),
        subtitle: `${count} product${count === 1 ? '' : 's'}`,
      }
    },
  },
}
