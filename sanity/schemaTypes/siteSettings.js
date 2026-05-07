export default {
  name: 'siteSettings',
  type: 'document',
  title: 'Site Settings',
  fields: [
    {
      name: 'siteTitle',
      type: 'string',
      title: 'Site Title',
    },
    {
      name: 'metaDescription',
      type: 'text',
      title: 'Meta Description',
      rows: 3,
    },
    {
      name: 'ogImage',
      type: 'image',
      title: 'OG Image',
    },
  ],
}
