import {StarIcon} from '@sanity/icons'

/**
 * Home page module: a single product given prominence (larger image + meta).
 * Live price/availability still comes from the buy-box fetch at render time.
 */
export default {
  name: 'moduleFeaturedProduct',
  type: 'object',
  title: 'Featured Product',
  icon: StarIcon,
  fields: [
    {
      name: 'heading',
      type: 'string',
      title: 'Eyebrow',
      description: 'Optional small label shown above the product (e.g. "New").',
    },
    {
      name: 'product',
      type: 'reference',
      title: 'Product',
      to: [{type: 'product'}],
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: {title: 'product.store.title', heading: 'heading'},
    prepare({title, heading}) {
      return {
        title: title || 'Featured Product',
        subtitle: heading ? `Featured · ${heading}` : 'Featured product',
      }
    },
  },
}
