import {StarIcon} from '@sanity/icons'
import {englishIfAny} from '../lib/i18nValidation'

/**
 * Home page module: a single product given prominence — heading/subheading
 * above the product's feature carousel. The carousel slides
 * (images + highlights) live on the product document (featureCarousel) so
 * the PDP shows the same ones. Live price/availability still comes from the
 * buy-box fetch at render time; text fields are language-axis
 * (internationalized arrays).
 */
export default {
  name: 'moduleFeaturedProduct',
  type: 'object',
  title: 'Featured Product',
  icon: StarIcon,
  fields: [
    {
      name: 'heading',
      type: 'internationalizedArrayString',
      title: 'Heading',
      description: 'Large heading above the carousel (e.g. "Meet the Speedy 01").',
      validation: englishIfAny,
    },
    {
      name: 'subheading',
      type: 'internationalizedArrayString',
      title: 'Subheading',
      description: 'Small label under the heading.',
      validation: englishIfAny,
    },
    {
      name: 'product',
      type: 'reference',
      title: 'Product',
      description:
        'The product to feature. The slides shown here are its Feature Carousel (edit them on the product), and the button opens its buy panel.',
      to: [{type: 'product'}],
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: {title: 'product.store.title', heading: 'heading.0.value'},
    prepare({title, heading}) {
      return {
        title: title || 'Featured Product',
        subtitle: heading ? `Featured · ${heading}` : 'Featured product',
      }
    },
  },
}
