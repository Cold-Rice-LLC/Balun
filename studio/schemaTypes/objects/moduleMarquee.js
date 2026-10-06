import {ImageRemoveIcon} from '@sanity/icons'
import {requireEnglish} from '../lib/i18nValidation'

/**
 * Home page module: an animated marquee band of repeating text, optionally
 * linking somewhere. One or more texts run in order, a dot after each. The
 * texts ARE the label — the link carries no label of its own (linkTarget,
 * not navLink).
 *
 * Texts replaced the single `text` field; scripts/migrateMarqueeTexts.mjs
 * moves existing content across.
 */
export default {
  name: 'moduleMarquee',
  type: 'object',
  title: 'Marquee',
  icon: ImageRemoveIcon,
  fields: [
    {
      name: 'texts',
      type: 'array',
      title: 'Texts',
      description:
        'Run across the band in order, separated by dots, then repeat (e.g. "Featured on 12.05.2026 live stream").',
      validation: (Rule) => Rule.required().min(1),
      of: [
        {
          type: 'object',
          name: 'marqueeText',
          title: 'Text',
          fields: [
            {
              name: 'text',
              type: 'internationalizedArrayString',
              title: 'Text',
              validation: requireEnglish,
            },
          ],
          preview: {
            select: {title: 'text.0.value'},
          },
        },
      ],
    },
    {
      name: 'link',
      type: 'linkTarget',
      title: 'Link',
      description: 'Optional — makes the whole marquee clickable.',
    },
  ],
  preview: {
    select: {text: 'texts.0.text.0.value', second: 'texts.1.text.0.value'},
    prepare({text, second}) {
      return {
        title: [text, second && '…'].filter(Boolean).join(' · ') || 'Marquee',
        subtitle: 'Marquee',
      }
    },
  },
}
