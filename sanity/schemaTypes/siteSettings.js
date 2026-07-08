export default {
  name: 'siteSettings',
  type: 'document',
  title: 'Site Settings',
  fields: [
    {
      name: 'siteTitle',
      type: 'string',
      title: 'Site Title',
      description: 'The title of the site as it appears in the browser tab and search results.',
    },
    {
      name: 'metaDescription',
      type: 'text',
      title: 'Meta Description',
      rows: 3,
      description:
        'A fallback description for the site, used in search results. Can be overridden by per-page meta descriptions.',
    },
    {
      name: 'ogImage',
      type: 'image',
      title: 'OG Image',
      description: 'An image used for Open Graph metadata. Can be overridden by per-page images.',
    },
    {
      name: 'footerPrimaryLinks',
      type: 'array',
      title: 'Footer — Primary Links',
      description: 'The primary list of links shown in the footer.',
      of: [{type: 'navLink'}],
    },
    {
      name: 'footerSecondaryLinks',
      type: 'array',
      title: 'Footer — Secondary Links',
      description: 'The secondary list of links shown in the footer.',
      of: [{type: 'navLink'}],
    },
  ],
}
