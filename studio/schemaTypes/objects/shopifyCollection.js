/**
 * The `store` object Sanity Connect maintains on collection documents.
 * Machine-owned — see shopifyProduct.js. Note Connect does NOT sync which
 * products belong to a collection; fetch membership live from the Storefront
 * API (collection(handle:){ products }) if ever needed.
 */
export default {
  name: 'shopifyCollection',
  type: 'object',
  title: 'Shopify',
  readOnly: true,
  fields: [
    {
      name: 'isDeleted',
      type: 'boolean',
      title: 'Deleted in Shopify',
      description:
        'Set when it was deleted in Shopify. The document stays so nothing referencing it breaks, but the Studio lists and the site hide it.',
    },
    {name: 'title', type: 'string', title: 'Title', description: 'Collection name from Shopify.'},
    {name: 'id', type: 'number', title: 'ID', description: 'Shopify’s numeric ID.'},
    {name: 'gid', type: 'string', title: 'GID', description: 'Shopify’s global ID.'},
    {name: 'slug', type: 'slug', title: 'Slug', description: 'Shopify collection handle.'},
    {
      name: 'descriptionHtml',
      type: 'text',
      title: 'HTML Description',
      description: 'Shopify’s collection description.',
    },
    {
      name: 'sortOrder',
      type: 'string',
      title: 'Sort Order',
      description: 'How Shopify orders the products in this collection.',
    },
    {
      name: 'imageUrl',
      type: 'string',
      title: 'Image URL',
      description: 'Shopify’s collection image.',
    },
    {
      name: 'createdAt',
      type: 'string',
      title: 'Created At',
      description: 'When it was created in Shopify.',
    },
    {
      name: 'updatedAt',
      type: 'string',
      title: 'Updated At',
      description: 'When it was last saved in Shopify.',
    },
    {
      name: 'shopifyTriggeredAt',
      type: 'string',
      title: 'Last Synced At',
      description: 'When Sanity Connect last received it from Shopify.',
    },
    {
      name: 'shop',
      type: 'object',
      title: 'Shop',
      fields: [
        {
          name: 'domain',
          type: 'string',
          title: 'Domain',
          description: 'The Shopify store it was synced from.',
        },
      ],
    },
  ],
}
