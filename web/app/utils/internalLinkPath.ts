// The route for every document type an internal link can reference. Editors
// pick the document; this is the one place that knows where each type lives,
// so a routing change is a change here, not a content migration.

// Singletons (and their per-market overrides) map straight to their page.
const SINGLETON_PATHS: Record<string, string> = {
  homePage: '/',
  infoPage: '/info',
  livePage: '/live',
  feedPage: '/feed',
}

// Collections append the document's slug. Legal pages sit at the root.
const COLLECTION_BASES: Record<string, string> = {
  legalPage: '',
  feedPost: '/feed',
  product: '/products',
}

/**
 * The unprefixed path for a dereferenced internal link — `{_type, slug}` as
 * the queries project it (AppLink adds the locale prefix). Null when there's
 * nothing to point at (no reference chosen, an unpublished target, a
 * collection document missing its slug), so callers can fall back to
 * rendering no link.
 */
export const internalLinkPath = (internal?: { _type?: string; slug?: string | null } | null) => {
  if (!internal?._type) return null
  const fixed = SINGLETON_PATHS[internal._type]
  if (fixed) return fixed
  const base = COLLECTION_BASES[internal._type]
  if (base === undefined || !internal.slug) return null
  return `${base}/${internal.slug}`
}
