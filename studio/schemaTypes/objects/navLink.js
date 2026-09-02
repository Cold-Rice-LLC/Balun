/**
 * Reusable nav link. Used by siteSettings.footerPrimaryLinks / footerSecondaryLinks
 * (and reusable by the header nav later). Either points to an internal path rendered
 * as a nuxt-link, or an external URL that opens in a new tab.
 */
export default {
  name: 'navLink',
  type: 'object',
  title: 'Link',
  fields: [
    {
      name: 'label',
      type: 'string',
      title: 'Label',
      description: 'The link text as it appears in the footer.',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'linkType',
      type: 'string',
      title: 'Link Type',
      description:
        'Internal for a page on this site (opens in place); External for another website (opens in a new tab).',
      options: {
        list: [
          {title: 'Internal', value: 'internal'},
          {title: 'External', value: 'external'},
        ],
        layout: 'radio',
      },
      initialValue: 'internal',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'internalPath',
      type: 'string',
      title: 'Internal Path',
      description: 'A path on this site, e.g. /info or /products/some-drop.',
      hidden: ({parent}) => parent?.linkType !== 'internal',
      validation: (Rule) =>
        Rule.custom((value, context) =>
          context.parent?.linkType === 'internal' && !value ? 'Internal path is required.' : true,
        ),
    },
    {
      name: 'externalUrl',
      type: 'url',
      title: 'External URL',
      description: 'A full URL. Opens in a new tab.',
      hidden: ({parent}) => parent?.linkType !== 'external',
      validation: (Rule) =>
        Rule.custom((value, context) =>
          context.parent?.linkType === 'external' && !value ? 'External URL is required.' : true,
        ),
    },
  ],
  preview: {
    select: {
      label: 'label',
      linkType: 'linkType',
      internalPath: 'internalPath',
      externalUrl: 'externalUrl',
    },
    prepare: ({label, linkType, internalPath, externalUrl}) => ({
      title: label,
      subtitle: linkType === 'external' ? `↗ ${externalUrl || ''}` : internalPath || '',
    }),
  },
}
