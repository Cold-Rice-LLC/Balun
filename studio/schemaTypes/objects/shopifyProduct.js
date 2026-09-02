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
    {
      name: 'status',
      type: 'string',
      title: 'Status',
      description: 'Active, draft or archived in Shopify. Only active products appear on the site.',
    },
    {
      name: 'isDeleted',
      type: 'boolean',
      title: 'Deleted in Shopify',
      description:
        'Set when it was deleted in Shopify. The document stays so nothing referencing it breaks, but the Studio lists and the site hide it.',
    },
    {
      name: 'title',
      type: 'string',
      title: 'Title',
      description:
        'Product name from Shopify. Translations live in Shopify (Translate & Adapt), not here.',
    },
    {name: 'id', type: 'number', title: 'ID', description: 'Shopify’s numeric ID.'},
    {
      name: 'gid',
      type: 'string',
      title: 'GID',
      description: 'Shopify’s global ID — what the site uses to fetch live price and stock.',
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      description: 'Shopify handle — the product page URL is /products/<handle>.',
    },
    {
      name: 'descriptionHtml',
      type: 'text',
      title: 'HTML Description',
      description:
        'Shopify’s own description. Not shown on the site — the Description field above is used instead.',
    },
    {
      name: 'productType',
      type: 'string',
      title: 'Product Type',
      description: 'From Shopify. Not used by the site.',
    },
    {
      name: 'vendor',
      type: 'string',
      title: 'Vendor',
      description: 'From Shopify. Not used by the site.',
    },
    {
      name: 'tags',
      type: 'string',
      title: 'Tags',
      description:
        'Comma-separated Shopify tags. A group:<slug> tag links colourways of the same shoe on the product page.',
    },
    {
      name: 'previewImageUrl',
      type: 'string',
      title: 'Preview Image URL',
      description:
        'Shopify’s main product image. Not used by the site — it fetches the live image instead.',
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
      name: 'priceRange',
      type: 'object',
      title: 'Price Range (base currency)',
      description:
        'Snapshot in the store’s base currency. The site always shows live market prices from Shopify instead.',
      fields: [
        {name: 'minVariantPrice', type: 'number', title: 'Min'},
        {name: 'maxVariantPrice', type: 'number', title: 'Max'},
      ],
    },
    {
      name: 'options',
      type: 'array',
      title: 'Options',
      description: 'The product’s option names (e.g. Size) and their values.',
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
      description: 'One variant per option combination (e.g. each size).',
      of: [{type: 'reference', weak: true, to: [{type: 'productVariant'}]}],
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
