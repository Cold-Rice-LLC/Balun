import {DocumentTextIcon} from '@sanity/icons'
import {requireEnglish} from '../lib/i18nValidation'
import {marketField} from '../lib/marketField'

/**
 * A reusable policy/legal page (Terms, Returns, Privacy, …). One schema, many
 * instances — the slug drives the route (/{slug}, e.g. /returns). Identity is
 * slug × market: per slug, one default (no market) + optional per-market
 * overrides, resolved like the home page (document-level Pattern B) — a
 * market's returns policy can differ from the default's.
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
    marketField('legalPage', {scopeToSlug: true}),
    {
      name: 'title',
      type: 'internationalizedArrayString',
      title: 'Title',
      description: 'Heading at the top of the page.',
      validation: requireEnglish,
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      description:
        'URL path, e.g. "returns" → /returns. Must match the footer link. A market override MUST reuse the default page\'s slug — same route, different market.',
      options: {
        // Source from the English title for convenience.
        source: (doc) => doc.title?.find((t) => t.language === 'en')?.value,
        // Default slug uniqueness is per type, which would block a market
        // override from reusing the default's slug. Unique per (slug, market)
        // instead, mirroring the market field's own validation.
        isUnique: async (slug, context) => {
          const {document, getClient} = context
          const client = getClient({apiVersion: '2024-10-01'})
          const publishedId = document._id.replace(/^drafts\./, '')
          const count = await client.fetch(
            `count(*[
              _type == "legalPage"
              && !(_id in [$draft, $published])
              && slug.current == $slug
              && (market == $market || (!defined(market) && !defined($market)))
            ])`,
            {
              draft: `drafts.${publishedId}`,
              published: publishedId,
              slug,
              market: document.market ?? null,
            },
          )
          return count === 0
        },
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'body',
      type: 'internationalizedArrayBlockContent',
      title: 'Body',
      description: 'The policy text. Headings, lists, links and images are supported.',
      validation: requireEnglish,
    },
  ],
  preview: {
    select: {title: 'title', slug: 'slug.current', market: 'market'},
    prepare({title, slug, market}) {
      const en = title?.find((t) => t.language === 'en')?.value
      return {
        title: en || slug || 'Legal Page',
        subtitle: `${slug ? `/${slug}` : 'No slug'} — ${market ? market.toUpperCase() : 'Default'}`,
      }
    },
  },
}
