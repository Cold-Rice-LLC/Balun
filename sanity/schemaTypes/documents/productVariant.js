import {TagsIcon} from '@sanity/icons'

/**
 * A Shopify product variant, synced by Sanity Connect (shopifyProductVariant-<id>).
 * Hidden from the desk structure — exists so product.store.variants references
 * resolve and the Studio doesn't warn about unknown types.
 */
export default {
  name: 'productVariant',
  type: 'document',
  title: 'Product Variant',
  icon: TagsIcon,
  fields: [
    {
      name: 'store',
      type: 'shopifyProductVariant',
      title: 'Shopify',
      description: 'Synced from Shopify by Sanity Connect. Read-only.',
    },
  ],
  preview: {
    select: {title: 'store.title', sku: 'store.sku'},
    prepare: ({title, sku}) => ({
      title: title || 'Untitled variant',
      subtitle: sku || undefined,
    }),
  },
}
