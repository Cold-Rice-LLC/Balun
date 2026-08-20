import {PlayIcon} from '@sanity/icons'
import {englishIfAny} from '../lib/i18nValidation'
import {marketField, marketPreviewTitle} from '../lib/marketField'

/**
 * The Live page. For now only the featured overlay is editorial: a location
 * label + description in the bottom-left corner, and the product its
 * "featured product" button opens (image + variant picker, added in place).
 * `streamUrl` is a placeholder for the eventual live-stream integration —
 * nothing renders it yet.
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
    {
      name: 'streamUrl',
      type: 'url',
      title: 'Stream URL',
      description: 'Placeholder for the live-stream integration — not rendered yet.',
    },
    {
      name: 'isLive',
      type: 'boolean',
      title: 'Live Now',
      description: 'Flip on when the stream starts — feed stream cards link to /live while this is on.',
      initialValue: false,
    },
  ],
  preview: {
    select: {market: 'market'},
    prepare: ({market}) => ({title: marketPreviewTitle('Live', market)}),
  },
}
