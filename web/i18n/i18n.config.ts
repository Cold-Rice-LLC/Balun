/**
 * vue-i18n options. Missing keys in a non-default language fall back to
 * English instead of rendering the bare key — same philosophy as the GROQ
 * i18nField() coalesce for Sanity content.
 */
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en-us',
  // Fallback is by design (partial catalogs are fine); don't spam the console.
  fallbackWarn: false,
  missingWarn: false,
}))
