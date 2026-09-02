import {BlockContentIcon} from '@sanity/icons'
import {requireEnglish} from '../lib/i18nValidation'

/**
 * Info page module: a small centered text block (4 of 12 grid columns,
 * Monument Grotesk Mono caps). Line breaks are kept.
 */
export default {
  name: 'moduleInfoText',
  type: 'object',
  title: 'Text',
  icon: BlockContentIcon,
  fields: [
    {
      name: 'text',
      type: 'internationalizedArrayText',
      title: 'Text',
      description:
        'Small centered block of mono caps. Line breaks are kept, so break lines where you want them.',
      validation: requireEnglish,
    },
  ],
  preview: {
    select: {text: 'text.0.value'},
    prepare({text}) {
      return {title: text || 'Text', subtitle: 'Text module'}
    },
  },
}
