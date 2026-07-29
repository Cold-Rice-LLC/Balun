import {InfoOutlineIcon} from '@sanity/icons'
import {requireEnglish} from '../lib/i18nValidation'

/**
 * The Info/About page: modular (page builder) — text (4 cols), image (6 cols),
 * and intermingled text+images (full width) modules on a black background.
 * Same content in every market, translated per language — text fields are
 * internationalized arrays resolved by $lang (the language axis; see
 * docs/shopify-and-localization-strategy.md §3).
 */
export default {
  name: 'infoPage',
  type: 'document',
  title: 'Info Page',
  icon: InfoOutlineIcon,
  fields: [
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
      of: [{type: 'moduleInfoText'}, {type: 'moduleInfoImage'}, {type: 'moduleInfoProse'}],
    },
  ],
  preview: {
    prepare: () => ({title: 'Info'}),
  },
}
