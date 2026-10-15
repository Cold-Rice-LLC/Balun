import {linkTargetFields, linkTargetSelect, linkTargetSubtitle} from './linkTarget'
import {requireEnglish} from '../lib/i18nValidation'

/**
 * Reusable nav link: a translated label plus a required destination (see
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
      type: 'internationalizedArrayString',
      title: 'Label',
      description: 'The link text as it appears in the footer.',
      validation: requireEnglish,
    },
    ...linkTargetFields({required: true}),
  ],
  preview: {
    select: {label: 'label.0.value', ...linkTargetSelect()},
    prepare: ({label, ...link}) => ({title: label || 'Link', subtitle: linkTargetSubtitle(link)}),
  },
}
