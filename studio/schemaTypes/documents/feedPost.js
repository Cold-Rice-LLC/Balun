import {DocumentTextIcon} from '@sanity/icons'
import {requireEnglish, englishIfAny} from '../lib/i18nValidation'

const CATEGORIES = [
  {title: 'Stream', value: 'stream'},
  {title: 'Products', value: 'products'},
  {title: 'Events', value: 'events'},
  {title: 'Blog', value: 'blog'},
]

/**
 * A post on the Feed page. Every post gets a detail page at /feed/<slug>;
 * stream posts link to /live instead while the live page's `isLive` toggle is
 * on. Category drives the card's fallback background (events = yellow, blog =
 * grey, products = light, stream = purple) and its extras: events get an RSVP
 * link, streams get a detail-page recap video.
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
      description:
        'Heading on the feed card and the detail page. Stream cards show "Live stream" instead, so for those it only appears on the detail page.',
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
      description:
        'Sets the card colour and what it shows: Events get the excerpt and an RSVP link, Blog gets the excerpt, Products shows the cover, Stream gets a "watch" button and links to /live while the Live page is set to Live Now. Also the value the feed filter uses.',
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
      description:
        "Date printed on the card and the feed's sort order (newest first). Future dates still show — use publish/unpublish to hold a post.",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'coverImage',
      type: 'image',
      title: 'Cover Image',
      description:
        'Card background for stream/products posts; the right-side image on detail pages.',
      options: {hotspot: true},
    },
    {
      name: 'cardBackground',
      type: 'color',
      title: 'Card Accent Color',
      description:
        'Recolors the corner tab and its fade over the cover image. Leave empty for the category default.',
      options: {disableAlpha: true},
      // Only meaningful over a cover (solid cards keep category colors), so
      // only offered there. A value set and then orphaned by removing the
      // cover lingers in the data; the card ignores it without a cover.
      hidden: ({parent}) => !parent?.coverImage?.asset,
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
      description:
        "Long-form content for the post's detail view. Headings, lists, links and images are supported.",
      validation: englishIfAny,
    },
    {
      name: 'link',
      type: 'url',
      title: 'RSVP Link',
      description: 'Optional. Shown on the card as an RSVP link (opens a new tab — e.g. a form).',
      hidden: ({parent}) => parent?.category !== 'events',
    },
    {
      name: 'recapVideo',
      type: 'moduleVideo',
      title: 'Recap Video',
      description:
        'Recap of the stream, shown in the detail view once it is over.',
      hidden: ({parent}) => parent?.category !== 'stream',
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
