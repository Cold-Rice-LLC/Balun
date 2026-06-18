import {TagIcon} from '@sanity/icons'

/**
 * Supplemental content for a Shopify product. Shopify remains the source of truth for
 * title/price/inventory/images; this doc only adds editorial content. Linked to Shopify
 * by the stable GID (canonical) plus the handle (URLs / readability).
 */
export default {
  name: 'product',
  type: 'document',
  title: 'Product',
  icon: TagIcon,
  fields: [
    {
      name: 'internalTitle',
      type: 'string',
      title: 'Internal Title',
      description: 'Editor-facing label for this product in the Studio. Shopify owns the real title.',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'shopifyGid',
      type: 'string',
      title: 'Shopify Product ID (GID)',
      description: 'Canonical, stable key, e.g. gid://shopify/Product/1234567890',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'shopifyHandle',
      type: 'string',
      title: 'Shopify Handle',
      description: 'Used for URLs / readability. May change if the product is renamed in Shopify.',
    },
    {
      name: 'tagline',
      type: 'string',
      title: 'Tagline',
    },
    {
      name: 'body',
      type: 'blockContent',
      title: 'Supplemental Content',
    },
    {
      name: 'gallery',
      type: 'array',
      title: 'Gallery',
      of: [{type: 'image', options: {hotspot: true}}],
    },
  ],
  preview: {
    select: {title: 'internalTitle', subtitle: 'shopifyHandle', media: 'gallery.0'},
  },
}
