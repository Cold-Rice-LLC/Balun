// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/sanity'],

  // Public, read-only config — published content needs no token.
  sanity: {
    projectId: 'pful3cpt',
    dataset: 'production',
    useCdn: true,
    apiVersion: '2024-10-01',
  },
})
