import {FolderIcon} from '@sanity/icons'

/**
 * A Shopify collection, synced by Sanity Connect (shopifyCollection-<id>).
 * Product membership is NOT synced — fetch it live from the Storefront API
 * if a collection page ever needs it. Editorial fields can be added as
 * siblings of `store` later (e.g. a curated hero per collection).
 */
export default {
  name: 'collection',
  type: 'document',
  title: 'Collection',
  icon: FolderIcon,
  fields: [
    {
      name: 'store',
      type: 'shopifyCollection',
      title: 'Shopify',
      description: 'Synced from Shopify by Sanity Connect. Read-only.',
    },
  ],
  preview: {
    select: {title: 'store.title', slug: 'store.slug.current'},
    prepare: ({title, slug}) => ({
      title: title || 'Untitled collection',
      subtitle: slug ? `/${slug}` : undefined,
    }),
  },
}
