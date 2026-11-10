import {defineConfig, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {colorInput} from '@sanity/color-input'
import {muxInput} from 'sanity-plugin-mux-input'
import {LANGUAGES, DEFAULT_LANGUAGE} from '../locales.mjs'
import {schemaTypes} from './schemaTypes'
import {myStructure, singletonTypes} from './myStructure'
import {openPreviewAction, previewTypes} from './actions/openPreview'

// Supported content languages (the {lang} half of the /{lang}-{country} URL),
// from the repo-root shared module — see docs/adding-a-market.md.
// Registers internationalizedArrayString / internationalizedArrayText /
// internationalizedArrayBlockContent / internationalizedArrayProseContent
// field types (used by translated editorial fields like legalPage title/body,
// image highlight callouts, the info page's intermingled module).
const internationalizedArrayPlugin = internationalizedArray({
  languages: LANGUAGES.map(({id, title}) => ({id, title})),
  defaultLanguages: [DEFAULT_LANGUAGE],
  fieldTypes: [
    'string',
    'text',
    defineField({name: 'blockContent', type: 'blockContent'}),
    defineField({name: 'proseContent', type: 'proseContent'}),
  ],
})

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

  plugins: [
    structureTool({structure: myStructure}),
    visionTool(),
    internationalizedArrayPlugin,
    colorInput(),
    // Every uploaded video goes to Mux (the `mux.video` field type), never
    // Sanity's file store; long-form video is a Vimeo/YouTube embed instead.
    // Each upload also gets a plain MP4 (`highest`), which the site plays for
    // the silent loops instead of loading Mux's streaming player. See
    // docs/video.md.
    muxInput({static_renditions: ['highest']}),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    // For singletons, strip create / delete / duplicate so editors can't make extras.
    // For Shopify-synced types, strip delete / duplicate / unpublish — Shopify
    // owns their lifecycle (see shopifySyncedTypes above).
    // Types with a page also get "Open preview" (studio/actions/openPreview.js).
    actions: (input, context) => {
      let actions = input
      if (singletonTypes.includes(context.schemaType)) {
        actions = input.filter(({action}) => action && singletonActions.has(action))
      } else if (shopifySyncedTypes.has(context.schemaType)) {
        actions = input.filter(({action}) => action && !shopifyBlockedActions.has(action))
      }
      return previewTypes.includes(context.schemaType) ? [...actions, openPreviewAction] : actions
    },
    // Keep synced types out of the global "create new document" menu — a
    // hand-made product/collection doc would be an orphan Connect never syncs.
    newDocumentOptions: (prev) =>
      prev.filter((template) => !shopifySyncedTypes.has(template.templateId)),
  },
})
