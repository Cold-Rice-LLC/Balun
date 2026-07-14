// Central GROQ queries so they're reusable and easy to eyeball/test.
import { groq } from '#imports'

// Shared product projection. Product docs are synced by Sanity Connect:
// identity/title/slug live under the machine-owned `store` object (flattened
// here so components don't care), editorial fields are siblings. Live market
// price/stock still comes from /api/products by gid at render time.
const productProjection = `
  _id,
  "title": store.title,
  "gid": store.gid,
  "slug": store.slug.current,
  tagline,
  gallery
`

// The home page is modular (page builder) and market-scoped at the DOCUMENT
// level (docs/shopify-and-localization-strategy.md §3, document Pattern B):
// pick this market's page if it exists, else the default (no market). Ordering
// defined(market) first means the market-specific page wins; [0] takes it, and
// falls through to the default otherwise. Each market URL caches its own shell.
//
// Modules project per-type. Product references are filtered to still-sellable
// items (buy-box null-handling covers any a market's catalog omits).
export const homeQuery = groq`*[
  _type == "homePage" && (market == $market || !defined(market))
] | order(defined(market) desc)[0]{
  "modules": modules[]{
    _type,
    _key,
    _type == "moduleProductGrid" => {
      heading,
      "products": products[@->store.status == "active" && @->store.isDeleted != true]->{${productProjection}}
    },
    _type == "moduleFeaturedProduct" => {
      heading,
      "product": product->{${productProjection}}
    }
  }
}`

// Info and feed content is translated (internationalized arrays): resolve the
// current $lang with an English fallback so untranslated fields still render.
const i18nField = (name: string) =>
  `"${name}": coalesce(${name}[language == $lang][0].value, ${name}[language == "en"][0].value)`

export const infoQuery = groq`*[_type == "infoPage"][0]{
  ${i18nField('title')},
  ${i18nField('body')}
}`

// A reusable policy page by slug. Title/body are internationalized arrays
// (sanity-plugin-internationalized-array): resolve the current $lang, falling
// back to English so an untranslated page still renders. Slug is language-
// agnostic — the {lang} URL prefix carries language, not the path.
export const legalPageQuery = groq`*[_type == "legalPage" && slug.current == $slug][0]{
  ${i18nField('title')},
  ${i18nField('body')}
}`

export const feedQuery = groq`{
  "page": *[_type == "feedPage"][0]{ title, intro },
  "posts": *[_type == "feedPost"] | order(publishedAt desc){
    _id,
    ${i18nField('title')},
    category,
    publishedAt,
    coverImage,
    ${i18nField('body')}
  }
}`

export const liveQuery = groq`*[_type == "livePage"][0]{
  title
}`

// PDP editorial shell: one product by its Shopify handle (synced slug).
// Live commerce data (variants/price/stock) comes from /api/product, not here.
// `tags` is exposed so the page can parse the colorway group tag (group:<slug>).
export const productPageQuery = groq`*[
  _type == "product" && store.slug.current == $handle && store.isDeleted != true
][0]{
  _id,
  "title": store.title,
  "gid": store.gid,
  "slug": store.slug.current,
  "status": store.status,
  "tags": store.tags,
  tagline,
  body,
  gallery
}`

// Colorway siblings: products sharing the group:<slug> Shopify tag (see
// docs/shopify-and-localization-strategy.md §4). $groupTag == "" (product has
// no group tag) matches nothing, so callers can pass it unconditionally.
export const colorwaysQuery = groq`*[
  _type == "product"
  && $groupTag != ""
  && $groupTag in string::split(store.tags, ", ")
  && store.slug.current != $handle
  && store.status == "active"
  && store.isDeleted != true
] | order(store.title asc) {
  _id,
  "title": store.title,
  "slug": store.slug.current,
  "gid": store.gid,
  gallery
}`

// Shared nav-link projection — used by both footer link lists.
const navLinkProjection = `
  label,
  linkType,
  internalPath,
  externalUrl
`

export const siteSettingsQuery = groq`*[_type == "siteSettings"][0]{
  footerPrimaryLinks[]{${navLinkProjection}},
  footerSecondaryLinks[]{${navLinkProjection}}
}`
