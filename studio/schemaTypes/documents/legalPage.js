import {DocumentTextIcon} from '@sanity/icons'
import {requireEnglish} from '../lib/i18nValidation'

/**
 * A reusable policy/legal page (Terms, Returns, Privacy, …). One schema, many
 * instances — the slug drives the route (/{slug}, e.g. /returns).
 *
 * Title and body are translated (internationalized arrays, resolved by $lang);
 * the slug is language-agnostic — the {lang} URL prefix carries language, not
 * the path. Same content, different words = the language axis, not the market
 * axis (docs/shopify-and-localization-strategy.md §3).
 */
export default {
  name: 'legalPage',
  type: 'document',
  title: 'Legal Page',
  icon: DocumentTextIcon,
  fields: [
    {
      name: 'title',
      type: 'internationalizedArrayString',
      title: 'Title',
      validation: requireEnglish,
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      description: 'URL path, e.g. "returns" → /returns. Must match the footer link.',
      // Source from the English title for convenience.
      options: {source: (doc) => doc.title?.find((t) => t.language === 'en')?.value},
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'body',
      type: 'internationalizedArrayBlockContent',
      title: 'Body',
      validation: requireEnglish,
    },
  ],
  preview: {
    select: {title: 'title', slug: 'slug.current'},
    prepare({title, slug}) {
      const en = title?.find((t) => t.language === 'en')?.value
      return {title: en || slug || 'Legal Page', subtitle: slug ? `/${slug}` : 'No slug'}
    },
  },
}
