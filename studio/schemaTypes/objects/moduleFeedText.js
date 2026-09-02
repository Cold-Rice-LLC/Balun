import {BlockContentIcon} from '@sanity/icons'
import {requireEnglish} from '../lib/i18nValidation'

/**
 * Feed detail module: a block of rich text (translated).
 */
export default {
  name: 'moduleFeedText',
  type: 'object',
  title: 'Text',
  icon: BlockContentIcon,
  fields: [
    {
      name: 'body',
      type: 'internationalizedArrayBlockContent',
      title: 'Text',
      description: 'Headings, lists, links and images are supported.',
      validation: requireEnglish,
    },
  ],
  preview: {
    select: {body: 'body.0.value'},
    prepare({body}) {
      const text = body
        ?.find((block) => block._type === 'block')
        ?.children?.map((child) => child.text)
        .join('')
      return {title: text || 'Text', subtitle: 'Text module'}
    },
  },
}
