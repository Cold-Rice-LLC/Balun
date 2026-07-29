import {ImageRemoveIcon} from '@sanity/icons'
import {requireEnglish} from '../lib/i18nValidation'

/**
 * Home page module: an animated marquee band of repeating text, optionally
 * linking somewhere. The text IS the label — the link carries no label of its
 * own (linkTarget, not navLink).
 */
export default {
  name: 'moduleMarquee',
  type: 'object',
  title: 'Marquee',
  icon: ImageRemoveIcon,
  fields: [
    {
      name: 'text',
      type: 'internationalizedArrayString',
      title: 'Text',
      description: 'Repeats across the band (e.g. "Featured on 12.05.2026 live stream").',
      validation: requireEnglish,
    },
    {
      name: 'link',
      type: 'linkTarget',
      title: 'Link',
      description: 'Optional — makes the whole marquee clickable.',
    },
  ],
  preview: {
    select: {text: 'text.0.value'},
    prepare({text}) {
      return {
        title: text || 'Marquee',
        subtitle: 'Marquee',
      }
    },
  },
}
