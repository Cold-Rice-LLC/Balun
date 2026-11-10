import {EyeOpenIcon} from '@sanity/icons'
import {DEFAULT_LANGUAGE, LOCALES} from '../../locales.mjs'

// The site that renders ?preview=true from drafts (web/app/plugins/
// preview.server.ts): a cache-off deploy — the password-gated staging site —
// since the cached production site never sees the query. Baked in at
// `sanity build`/`deploy` time. See docs/preview.md.
const SITE_URL = (process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)

// Mirrors web/app/utils/internalLinkPath.ts (the Studio can't import the web
// app's code) — change the two together.
const SINGLETON_PATHS = {
  homePage: '',
  infoPage: '/info',
  livePage: '/live',
  shopPage: '/products',
  feedPage: '/feed',
}
const COLLECTION_BASES = {
  legalPage: '',
  feedPost: '/feed',
  product: '/products',
}

export const previewTypes = [...Object.keys(SINGLETON_PATHS), ...Object.keys(COLLECTION_BASES)]

// A market override previews in its own market; everything else in the
// default locale (the first combo, en-us).
const localeFor = (market) =>
  (market && LOCALES.find((l) => l.country === market && l.lang === DEFAULT_LANGUAGE)?.code) ||
  LOCALES[0].code

const previewUrl = (type, doc) => {
  if (!doc) return null
  let path = SINGLETON_PATHS[type]
  if (path === undefined) {
    const slug = doc.slug?.current ?? doc.store?.slug?.current
    if (!slug) return null
    path = `${COLLECTION_BASES[type]}/${slug}`
  }
  return `${SITE_URL}/${localeFor(doc.market)}${path}?preview=true`
}

// "Open preview" in the document's action menu: the page with this
// document's unpublished edits, in a new tab. The draft carries the latest
// slug and market; published is the fallback with no pending edits.
export const openPreviewAction = ({type, draft, published}) => {
  const url = previewUrl(type, draft || published)
  return {
    label: 'Open preview',
    icon: EyeOpenIcon,
    // Collection documents need a slug before they have a page to show.
    disabled: !url,
    title: url ? undefined : 'Add a slug to preview this page',
    onHandle: () => {
      if (url) window.open(url, '_blank', 'noopener')
    },
  }
}
