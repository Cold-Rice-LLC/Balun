/**
 * The `store` object Sanity Connect maintains on productVariant documents.
 * Machine-owned — see shopifyProduct.js. Variant docs are hidden from the
 * desk structure; they exist so product.store.variants references resolve.
 */
export default {
  name: 'shopifyProductVariant',
  type: 'object',
  title: 'Shopify',
  readOnly: true,
  fields: [
    {name: 'status', type: 'string', title: 'Status'},
    {name: 'isDeleted', type: 'boolean', title: 'Deleted in Shopify'},
    {name: 'title', type: 'string', title: 'Title'},
    {name: 'id', type: 'number', title: 'ID'},
    {name: 'gid', type: 'string', title: 'GID'},
    {name: 'productId', type: 'number', title: 'Product ID'},
    {name: 'productGid', type: 'string', title: 'Product GID'},
    {name: 'sku', type: 'string', title: 'SKU'},
    {name: 'barcode', type: 'string', title: 'Barcode'},
    {name: 'price', type: 'number', title: 'Price (base currency)'},
    {name: 'compareAtPrice', type: 'number', title: 'Compare-at Price (base currency)'},
    {name: 'option1', type: 'string', title: 'Option 1'},
    {name: 'option2', type: 'string', title: 'Option 2'},
    {name: 'option3', type: 'string', title: 'Option 3'},
    {name: 'previewImageUrl', type: 'string', title: 'Preview Image URL'},
    {name: 'createdAt', type: 'string', title: 'Created At'},
    {name: 'updatedAt', type: 'string', title: 'Updated At'},
    {name: 'shopifyTriggeredAt', type: 'string', title: 'Last Synced At'},
    {
      name: 'inventory',
      type: 'object',
      title: 'Inventory',
      fields: [
        {name: 'isAvailable', type: 'boolean', title: 'Available'},
        {name: 'policy', type: 'string', title: 'Policy'},
        {name: 'management', type: 'string', title: 'Management'},
      ],
    },
    {
      name: 'shop',
      type: 'object',
      title: 'Shop',
      fields: [{name: 'domain', type: 'string', title: 'Domain'}],
    },
  ],
}
