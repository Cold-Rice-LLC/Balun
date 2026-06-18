import {DocumentTextIcon} from '@sanity/icons'

const CATEGORIES = [
  {title: 'Stream', value: 'stream'},
  {title: 'Products', value: 'products'},
  {title: 'Events', value: 'events'},
  {title: 'Blog', value: 'blog'},
]

/**
 * A post on the Feed page. Posts have no individual pages for now — they all render inline
 * on the feed, labelled/grouped by category.
 */
export default {
  name: 'feedPost',
  type: 'document',
  title: 'Feed Post',
  icon: DocumentTextIcon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
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
      const match = CATEGORIES.find((c) => c.value === category)
      return {title, subtitle: match ? match.title : category, media}
    },
  },
}
