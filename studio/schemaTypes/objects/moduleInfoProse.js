import {TextIcon} from '@sanity/icons'
import {requireEnglish} from '../lib/i18nValidation'

/**
 * Info page module: full-width display text (large purple type) with images
 * intermingled INSIDE the flow — the body is `proseContent`, whose blocks
 * allow inline images.
 */
export default {
  name: 'moduleInfoProse',
  type: 'object',
  title: 'Text + Images',
  icon: TextIcon,
  fields: [
    {
      name: 'body',
      type: 'internationalizedArrayProseContent',
      title: 'Body',
      description: 'Place images inline — they render inside the flowing text.',
      validation: requireEnglish,
    },
  ],
  preview: {
    prepare() {
      return {title: 'Text + Images', subtitle: 'Intermingled module'}
    },
  },
}
