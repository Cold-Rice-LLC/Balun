import {TagIcon} from '@sanity/icons'
import {englishIfAny} from '../lib/i18nValidation'

/**
 * A Shopify product. Documents are created and kept in sync by Sanity Connect
 * (ids like shopifyProduct-<id>) — do not create these by hand.
 *
 * The `store` object is machine-owned and overwritten on every Shopify save;
 * everything else is editorial and safe to edit — Connect never touches
 * sibling fields. Live commerce data (market price, stock) is still fetched
 * from the Storefront API at render time via store.gid; store.* is for
 * Studio UX, listing shells, and GROQ filtering only.
 */
export default {
  name: 'product',
  type: 'document',
  title: 'Product',
  icon: TagIcon,
  fields: [
    {
      name: 'store',
      type: 'shopifyProduct',
      title: 'Shopify',
      description: 'Synced from Shopify by Sanity Connect. Read-only.',
    },
    // Editorial siblings are translated in Sanity; Shopify-owned strings
    // (title/description) are translated in Shopify (Translate & Adapt) and
    // fetched with @inContext(language:) — never re-typed here.
    {
      name: 'tagline',
      type: 'internationalizedArrayString',
      title: 'Tagline',
      validation: englishIfAny,
    },
    {
      name: 'body',
      type: 'internationalizedArrayBlockContent',
      title: 'Description',
      description:
        "The product copy under the buy button on the PDP. This is the description the site shows — Shopify's own description is not used.",
      validation: englishIfAny,
    },
    {
      name: 'featuredImage',
      type: 'image',
      title: 'Featured Image',
      description:
        'The product image used on grid cards. Leave empty to fall back to the Shopify product image.',
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
        },
      ],
    },
    {
      name: 'gallery',
      type: 'array',
      title: 'Gallery',
      description: 'Lifestyle/editorial images — the draggable carousel on the left of the PDP.',
      of: [{type: 'image', options: {hotspot: true}}],
    },
    {
      name: 'featureCarousel',
      type: 'array',
      title: 'Feature Carousel',
      description:
        'Product images with text highlights. Shown in the home Featured Product module and on the PDP — one place to keep them in sync.',
      of: [{type: 'featureImage'}],
    },
  ],
  preview: {
    select: {
      title: 'store.title',
      status: 'store.status',
      isDeleted: 'store.isDeleted',
      media: 'gallery.0',
    },
    prepare: ({title, status, isDeleted, media}) => ({
      title: title || 'Untitled product',
      subtitle: isDeleted ? 'Deleted in Shopify' : status,
      media,
    }),
  },
}
