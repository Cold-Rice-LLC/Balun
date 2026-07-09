import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/sanity'],

  css: ['~/assets/css/global.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    public: {
      // Overridden by NUXT_PUBLIC_SHOPIFY_STORE_DOMAIN / NUXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN.
      // Storefront tokens are public-safe (read-only storefront + cart scope).
      // Empty token = server falls back to mock.shop for local dev.
      shopifyStoreDomain: '',
      shopifyStorefrontAccessToken: '',
      shopifyApiVersion: '2026-04',
    },
  },

  // Public, read-only config — published content needs no token.
  sanity: {
    projectId: 'pful3cpt',
    dataset: 'production',
    useCdn: true,
    apiVersion: '2024-10-01',
  },
})
