import {InfoOutlineIcon} from '@sanity/icons'
import {requireEnglish, englishIfAny} from '../lib/i18nValidation'

/**
 * The Info/About page. Same content in every market, translated per language —
 * title/body are internationalized arrays resolved by $lang (the language axis;
 * see docs/shopify-and-localization-strategy.md §3).
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
      validation: requireEnglish,
    },
    {
      name: 'body',
      type: 'internationalizedArrayBlockContent',
      title: 'Body',
      validation: englishIfAny,
    },
  ],
  preview: {
    prepare: () => ({title: 'Info'}),
  },
}
