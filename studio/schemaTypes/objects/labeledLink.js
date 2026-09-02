import {linkTargetFields, linkTargetSelect, linkTargetSubtitle} from './linkTarget'
import {requireEnglish} from '../lib/i18nValidation'

/**
 * A labeled link for editorial link rows: translated label plus a required
 * destination (see linkTarget). Used by the feed Links module. The home
 * Big Image + Headline module carries an equivalent inline `headlineLink`
 * that could adopt this with a data migration.
 */
export default {
  name: 'labeledLink',
  type: 'object',
  title: 'Link',
  fields: [
    {
      name: 'label',
      type: 'internationalizedArrayString',
      title: 'Label',
      description: 'The button text.',
      validation: requireEnglish,
    },
    ...linkTargetFields({required: true}),
  ],
  preview: {
    select: {label: 'label.0.value', ...linkTargetSelect()},
    prepare: ({label, ...link}) => ({title: label || 'Link', subtitle: linkTargetSubtitle(link)}),
  },
}
