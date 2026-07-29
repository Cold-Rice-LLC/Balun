import {DocumentTextIcon} from '@sanity/icons'
import {requireEnglish, englishIfAny} from '../lib/i18nValidation'

const CATEGORIES = [
  {title: 'Stream', value: 'stream'},
  {title: 'Products', value: 'products'},
  {title: 'Events', value: 'events'},
  {title: 'Blog', value: 'blog'},
]

/**
 * A post on the Feed page. Every post gets a detail page at /feed/<slug>
 * unless `link` is set — then the card links there instead (external opens a
 * new tab). Category drives styling only: events = yellow, blog = grey,
 * stream/products = cover-image background.
 *
 * Title/excerpt/body are translated (internationalized arrays resolved by
 * $lang); category, slug, date, image, and link are language-agnostic (the
 * language axis — same content, different words; see
 * docs/shopify-and-localization-strategy.md §3).
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
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      description: 'URL of the detail page: /feed/<slug>.',
      options: {
        source: (doc) => doc.title?.find?.((t) => t.language === 'en')?.value ?? '',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
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
      description: 'Card background for stream/products posts; the right-side image on detail pages.',
      options: {hotspot: true},
    },
    {
      name: 'excerpt',
      type: 'internationalizedArrayText',
      title: 'Excerpt',
      description: 'Short text on the feed card itself (e.g. event details).',
      validation: englishIfAny,
    },
    {
      name: 'body',
      type: 'internationalizedArrayBlockContent',
      title: 'Body',
      description: 'Detail-page content.',
      validation: englishIfAny,
    },
    {
      name: 'link',
      type: 'linkTarget',
      title: 'Link Override',
      description:
        'Optional. If set, the card links here instead of its detail page (external URLs open a new tab — e.g. an RSVP form).',
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
