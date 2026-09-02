import {linkTargetFields, linkTargetSelect, linkTargetSubtitle} from './linkTarget'

/**
 * Reusable nav link: a plain label plus a required destination (see
 * linkTarget). Used by siteSettings.footerPrimaryLinks / footerSecondaryLinks
 * (and reusable by the header nav later).
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
    ...linkTargetFields({required: true}),
  ],
  preview: {
    select: {label: 'label', ...linkTargetSelect()},
    prepare: ({label, ...link}) => ({title: label, subtitle: linkTargetSubtitle(link)}),
  },
}
