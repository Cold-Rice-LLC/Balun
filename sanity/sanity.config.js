import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {myStructure, singletonTypes} from './myStructure'

// Actions that don't make sense for singletons (one fixed document per type).
const singletonActions = new Set(['publish', 'discardChanges', 'restore'])

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
    actions: (input, context) =>
      singletonTypes.includes(context.schemaType)
        ? input.filter(({action}) => action && singletonActions.has(action))
        : input,
  },
})
