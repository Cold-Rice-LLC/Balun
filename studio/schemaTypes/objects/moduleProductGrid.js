import {ThLargeIcon} from '@sanity/icons'

/**
 * Home page module: a grid of products. Products are Sanity Connect references;
 * listings filter to still-sellable ones at query time (see homeQuery), and the
 * buy-box/card null-handling covers any that a market's catalog doesn't publish.
 */
export default {
  name: 'moduleProductGrid',
  type: 'object',
  title: 'Product Grid',
  icon: ThLargeIcon,
  fields: [
    {
      name: 'heading',
      type: 'string',
      title: 'Heading',
      description: 'Optional label shown above the grid (e.g. "Featured").',
    },
    {
      name: 'products',
      type: 'array',
      title: 'Products',
      of: [{type: 'reference', to: [{type: 'product'}]}],
      validation: (Rule) => Rule.min(1).error('Add at least one product.'),
    },
  ],
  preview: {
    select: {heading: 'heading', products: 'products'},
    prepare({heading, products}) {
      const count = products?.length ?? 0
      return {
        title: heading || 'Product Grid',
        subtitle: `Product grid · ${count} product${count === 1 ? '' : 's'}`,
      }
    },
  },
}
