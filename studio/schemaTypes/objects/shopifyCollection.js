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
    {name: 'isDeleted', type: 'boolean', title: 'Deleted in Shopify'},
    {name: 'title', type: 'string', title: 'Title'},
    {name: 'id', type: 'number', title: 'ID'},
    {name: 'gid', type: 'string', title: 'GID'},
    {name: 'slug', type: 'slug', title: 'Slug'},
    {name: 'descriptionHtml', type: 'text', title: 'HTML Description'},
    {name: 'sortOrder', type: 'string', title: 'Sort Order'},
    {name: 'imageUrl', type: 'string', title: 'Image URL'},
    {name: 'createdAt', type: 'string', title: 'Created At'},
    {name: 'updatedAt', type: 'string', title: 'Updated At'},
    {name: 'shopifyTriggeredAt', type: 'string', title: 'Last Synced At'},
    {
      name: 'shop',
      type: 'object',
      title: 'Shop',
      fields: [{name: 'domain', type: 'string', title: 'Domain'}],
    },
  ],
}
