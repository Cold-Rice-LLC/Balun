/**
 * The `store` object Sanity Connect maintains on product documents.
 * Machine-owned: overwritten on every product save in Shopify — never edit,
 * never add fields here expecting them to persist. Field set mirrors what
 * Connect actually syncs for this store.
 *
 * Note: prices here are base-currency snapshots. Live market pricing always
 * comes from the Storefront API (@inContext) — see
 * docs/shopify-and-localization-strategy.md.
 */
export default {
  name: 'shopifyProduct',
  type: 'object',
  title: 'Shopify',
  readOnly: true,
  fields: [
    {name: 'status', type: 'string', title: 'Status'},
    {name: 'isDeleted', type: 'boolean', title: 'Deleted in Shopify'},
    {name: 'title', type: 'string', title: 'Title'},
    {name: 'id', type: 'number', title: 'ID'},
    {name: 'gid', type: 'string', title: 'GID'},
    {name: 'slug', type: 'slug', title: 'Slug'},
    {name: 'descriptionHtml', type: 'text', title: 'HTML Description'},
    {name: 'productType', type: 'string', title: 'Product Type'},
    {name: 'vendor', type: 'string', title: 'Vendor'},
    {name: 'tags', type: 'string', title: 'Tags'},
    {name: 'previewImageUrl', type: 'string', title: 'Preview Image URL'},
    {name: 'createdAt', type: 'string', title: 'Created At'},
    {name: 'updatedAt', type: 'string', title: 'Updated At'},
    {name: 'shopifyTriggeredAt', type: 'string', title: 'Last Synced At'},
    {
      name: 'priceRange',
      type: 'object',
      title: 'Price Range (base currency)',
      fields: [
        {name: 'minVariantPrice', type: 'number', title: 'Min'},
        {name: 'maxVariantPrice', type: 'number', title: 'Max'},
      ],
    },
    {
      name: 'options',
      type: 'array',
      title: 'Options',
      of: [
        {
          name: 'option',
          type: 'object',
          title: 'Option',
          fields: [
            {name: 'name', type: 'string', title: 'Name'},
            {name: 'values', type: 'array', title: 'Values', of: [{type: 'string'}]},
          ],
        },
      ],
    },
    {
      name: 'variants',
      type: 'array',
      title: 'Variants',
      of: [{type: 'reference', weak: true, to: [{type: 'productVariant'}]}],
    },
    {
      name: 'shop',
      type: 'object',
      title: 'Shop',
      fields: [{name: 'domain', type: 'string', title: 'Domain'}],
    },
  ],
}
