import {PlayIcon} from '@sanity/icons'
import {englishIfAny} from '../lib/i18nValidation'
import {marketField, marketPreviewTitle} from '../lib/marketField'

/**
 * The Live page's editorial half: a location label + description in the
 * bottom-left corner, and the product its "featured product" button opens
 * (image + variant picker, added in place). The stream itself is global —
 * one streamer, live for every market at once — so the Mux IDs and the
 * Live Now state live on Site Settings (see docs/live-streaming.md).
 * Not a singleton: one default (no market) + optional per-market overrides,
 * resolved like the home page (document-level Pattern B).
 */
export default {
  name: 'livePage',
  type: 'document',
  title: 'Live Page',
  icon: PlayIcon,
  fields: [
    marketField('livePage'),
    {
      name: 'location',
      type: 'internationalizedArrayString',
      title: 'Location Label',
      description: 'E.g. "Live from Tokyo".',
      validation: englishIfAny,
    },
    {
      name: 'description',
      type: 'internationalizedArrayText',
      title: 'Description',
      description: 'Short blurb next to the location label.',
      validation: englishIfAny,
    },
    {
      name: 'featuredProduct',
      type: 'reference',
      title: 'Featured Product',
      to: [{type: 'product'}],
      description: 'Opens in the quick-add popup from the "featured product" button.',
    },
  ],
  preview: {
    select: {market: 'market'},
    prepare: ({market}) => ({title: marketPreviewTitle('Live', market)}),
  },
}
