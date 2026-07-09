import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {myStructure, singletonTypes} from './myStructure'

// Actions that don't make sense for singletons (one fixed document per type).
const singletonActions = new Set(['publish', 'discardChanges', 'restore'])

// Types owned by the Sanity Connect sync — their lifecycle belongs to Shopify.
// Deleting/duplicating/unpublishing here just fights the sync (a deleted doc
// gets recreated on the next Shopify save, minus its editorial fields).
// Retire products by archiving/deleting them in Shopify instead.
const shopifySyncedTypes = new Set(['product', 'productVariant', 'collection'])
const shopifyBlockedActions = new Set(['delete', 'duplicate', 'unpublish'])

export default defineConfig({
  name: 'default',
  title: 'Balun',

  projectId: 'pful3cpt',
  dataset: 'production',

  plugins: [structureTool({structure: myStructure}), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    // For singletons, strip create / delete / duplicate so editors can't make extras.
    // For Shopify-synced types, strip delete / duplicate / unpublish — Shopify
    // owns their lifecycle (see shopifySyncedTypes above).
    actions: (input, context) => {
      if (singletonTypes.includes(context.schemaType)) {
        return input.filter(({action}) => action && singletonActions.has(action))
      }
      if (shopifySyncedTypes.has(context.schemaType)) {
        return input.filter(({action}) => action && !shopifyBlockedActions.has(action))
      }
      return input
    },
    // Keep synced types out of the global "create new document" menu — a
    // hand-made product/collection doc would be an orphan Connect never syncs.
    newDocumentOptions: (prev) =>
      prev.filter((template) => !shopifySyncedTypes.has(template.templateId)),
  },
})
