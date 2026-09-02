/**
 * Label-less link target: an internal path or an external URL. Use when the
 * clickable content already exists on its own (e.g. the marquee's text) —
 * `navLink` is the labeled variant for nav/footer link lists.
 *
 * Named linkTarget (not `link`) to avoid shadowing the blockContent `link`
 * annotation.
 */
export default {
  name: 'linkTarget',
  type: 'object',
  title: 'Link',
  fields: [
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
    select: {linkType: 'linkType', internalPath: 'internalPath', externalUrl: 'externalUrl'},
    prepare: ({linkType, internalPath, externalUrl}) => ({
      title: linkType === 'external' ? `↗ ${externalUrl || ''}` : internalPath || 'Link',
    }),
  },
}
