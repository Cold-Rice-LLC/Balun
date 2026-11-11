import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'pful3cpt',
    dataset: 'production'
  },
  deployment: {
    // The hosted studio, balun.sanity.studio — deploys go here without a prompt.
    appId: 'tq0zec9nbnrh11hjj1cui2li',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  }
})
