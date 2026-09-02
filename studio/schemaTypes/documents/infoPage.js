import {InfoOutlineIcon} from '@sanity/icons'
import {requireEnglish} from '../lib/i18nValidation'
import {marketField, marketPreviewTitle} from '../lib/marketField'

/**
 * The Info/About page: modular (page builder) — text (4 cols), image (6 cols),
 * intermingled text+images (full width) and click-to-play video (shared with
 * the home page) modules on a black background.
 * Not a singleton: one default (no market) + optional per-market overrides,
 * resolved like the home page (document-level Pattern B). Within each document,
 * text fields are internationalized arrays resolved by $lang (the language
 * axis; see docs/shopify-and-localization-strategy.md §3).
 */
export default {
  name: 'infoPage',
  type: 'document',
  title: 'Info Page',
  icon: InfoOutlineIcon,
  fields: [
    marketField('infoPage'),
    {
      name: 'title',
      type: 'internationalizedArrayString',
      title: 'Title',
      description: 'Used for the browser tab / SEO, not shown on the page.',
      validation: requireEnglish,
    },
    {
      name: 'modules',
      type: 'array',
      title: 'Modules',
      description:
        'Page builder — add and reorder Text, Image, Text + Images and Video modules; they stack top to bottom on the black page.',
      of: [
        {type: 'moduleInfoText'},
        {type: 'moduleInfoImage'},
        {type: 'moduleInfoProse'},
        {type: 'moduleVideo'},
      ],
    },
  ],
  preview: {
    select: {market: 'market'},
    prepare: ({market}) => ({title: marketPreviewTitle('Info', market)}),
  },
}
