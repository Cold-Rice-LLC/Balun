export default {
  name: 'siteSettings',
  type: 'document',
  title: 'Site Settings',
  fields: [
    {
      name: 'siteTitle',
      type: 'string',
      title: 'Site Title',
      description:
        'Intended for the browser tab and search results. Not wired up on the site yet — page titles are set in code for now.',
    },
    {
      name: 'metaDescription',
      type: 'text',
      title: 'Meta Description',
      rows: 3,
      description:
        'Intended as the site-wide fallback for search-result snippets. Not wired up on the site yet.',
    },
    {
      name: 'ogImage',
      type: 'image',
      title: 'OG Image',
      description:
        'Intended as the preview image when a link to the site is shared. Not wired up on the site yet.',
    },
    {
      name: 'footerPrimaryLinks',
      type: 'array',
      title: 'Footer — Primary Links',
      description: 'The main link list in the footer (e.g. Info, Feed, Live). Drag to reorder.',
      of: [{type: 'navLink'}],
    },
    {
      name: 'footerSecondaryLinks',
      type: 'array',
      title: 'Footer — Secondary Links',
      description:
        'The smaller link list in the footer, for policies and social links. Drag to reorder.',
      of: [{type: 'navLink'}],
    },
  ],
}
