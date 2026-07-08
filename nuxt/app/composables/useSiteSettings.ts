// Shared site-settings fetch. useSanityQuery dedupes by query key, so any
// number of components can call this and share a single fetch/payload.
// Add new settings fields to siteSettingsQuery in utils/queries.ts.
export const useSiteSettings = () => useSanityQuery(siteSettingsQuery)
