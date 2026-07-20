import {DocumentTextIcon} from '@sanity/icons'
import {requireEnglish, englishIfAny} from '../lib/i18nValidation'

const CATEGORIES = [
  {title: 'Stream', value: 'stream'},
  {title: 'Products', value: 'products'},
  {title: 'Events', value: 'events'},
  {title: 'Blog', value: 'blog'},
]

/**
 * A post on the Feed page. Posts have no individual pages for now — they all render inline
 * on the feed, labelled/grouped by category.
 *
 * Title/body are translated (internationalized arrays resolved by $lang); category,
 * date, and image are language-agnostic (the language axis — same content, different
 * words; see docs/shopify-and-localization-strategy.md §3).
 */
export default {
  name: 'feedPost',
  type: 'document',
  title: 'Feed Post',
  icon: DocumentTextIcon,
  fields: [
    {
      name: 'title',
      type: 'internationalizedArrayString',
      title: 'Title',
      validation: requireEnglish,
    },
    {
      name: 'category',
      type: 'string',
      title: 'Category',
      options: {
        list: CATEGORIES,
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'publishedAt',
      type: 'datetime',
      title: 'Published At',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'coverImage',
      type: 'image',
      title: 'Cover Image',
      options: {hotspot: true},
    },
    {
      name: 'body',
      type: 'internationalizedArrayBlockContent',
      title: 'Body',
      validation: englishIfAny,
    },
  ],
  orderings: [
    {
      title: 'Published, newest first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', category: 'category', media: 'coverImage'},
    prepare({title, category, media}) {
      const en = Array.isArray(title) ? title.find((t) => t.language === 'en')?.value : title
      const match = CATEGORIES.find((c) => c.value === category)
      return {title: en || 'Untitled post', subtitle: match ? match.title : category, media}
    },
  },
}
