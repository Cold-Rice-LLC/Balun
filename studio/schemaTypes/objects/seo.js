import {englishIfAnyMaxLength} from '../lib/i18nValidation'

/**
 * How a page shows in search results and when shared. Every field is
 * optional: the site fills in what's left empty from the page itself (its
 * title, its tagline or excerpt, its image), or else from Site Settings.
 */
export default {
  name: 'seo',
  type: 'object',
  title: 'SEO',
  options: {collapsible: true, collapsed: true},
  fields: [
    {
      name: 'title',
      type: 'internationalizedArrayString',
      title: 'Title',
      description:
        'Replaces the page’s title in search results and shares. “— Balun” (the Site Title) follows it.',
      validation: englishIfAnyMaxLength(
        60,
        'Search results cut titles off at about 60 characters.',
      ),
    },
    {
      name: 'description',
      type: 'internationalizedArrayText',
      title: 'Description',
      validation: englishIfAnyMaxLength(
        160,
        'Search results cut descriptions off at about 160 characters.',
      ),
    },
    {
      name: 'image',
      type: 'image',
      title: 'Share Image',
      description: 'Cropped to 1200 × 630 around the hotspot.',
      options: {hotspot: true},
    },
  ],
}
