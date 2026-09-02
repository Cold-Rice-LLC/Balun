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
    {
      name: 'status',
      type: 'string',
      title: 'Status',
      description: 'Status of the parent product in Shopify.',
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
      description: 'Variant name — usually its option values (e.g. "US 9").',
    },
    {name: 'id', type: 'number', title: 'ID', description: 'Shopify’s numeric ID.'},
    {
      name: 'gid',
      type: 'string',
      title: 'GID',
      description: 'Shopify’s global ID — what the cart uses to add this variant.',
    },
    {
      name: 'productId',
      type: 'number',
      title: 'Product ID',
      description: 'Numeric ID of the parent product.',
    },
    {
      name: 'productGid',
      type: 'string',
      title: 'Product GID',
      description: 'Global ID of the parent product.',
    },
    {name: 'sku', type: 'string', title: 'SKU', description: 'Stock-keeping unit from Shopify.'},
    {
      name: 'barcode',
      type: 'string',
      title: 'Barcode',
      description: 'Barcode from Shopify (ISBN, UPC, GTIN…).',
    },
    {
      name: 'price',
      type: 'number',
      title: 'Price (base currency)',
      description:
        'Snapshot in the store’s base currency. The site shows live market prices instead.',
    },
    {
      name: 'compareAtPrice',
      type: 'number',
      title: 'Compare-at Price (base currency)',
      description:
        'The “was” price, if any. Base-currency snapshot; live prices come from Shopify.',
    },
    {
      name: 'option1',
      type: 'string',
      title: 'Option 1',
      description: 'Value of the product’s first option (e.g. the size).',
    },
    {
      name: 'option2',
      type: 'string',
      title: 'Option 2',
      description: 'Value of the product’s second option, if it has one.',
    },
    {
      name: 'option3',
      type: 'string',
      title: 'Option 3',
      description: 'Value of the product’s third option, if it has one.',
    },
    {
      name: 'previewImageUrl',
      type: 'string',
      title: 'Preview Image URL',
      description: 'Shopify’s image for this variant.',
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
      name: 'inventory',
      type: 'object',
      title: 'Inventory',
      description:
        'Stock snapshot at last sync. Live availability is checked from Shopify at render time.',
      fields: [
        {
          name: 'isAvailable',
          type: 'boolean',
          title: 'Available',
          description: 'In stock (or sellable regardless) at last sync.',
        },
        {
          name: 'policy',
          type: 'string',
          title: 'Policy',
          description: '“deny” stops selling when stock hits zero; “continue” keeps selling.',
        },
        {
          name: 'management',
          type: 'string',
          title: 'Management',
          description: 'Which system tracks stock for this variant (usually Shopify).',
        },
      ],
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
