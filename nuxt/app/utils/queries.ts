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

// Referenced products are filtered to those still sellable in Shopify —
// drafts, archived, and deleted products drop out of listings automatically.
// (Filter before dereferencing (@->) so non-matching items are removed
// entirely instead of leaving null holes in the array.)
export const homeQuery = groq`*[_type == "homePage"][0]{
  featuredProducts[@->store.status == "active" && @->store.isDeleted != true]->{${productProjection}}
}`

export const infoQuery = groq`*[_type == "infoPage"][0]{
  title,
  body
}`

export const feedQuery = groq`{
  "page": *[_type == "feedPage"][0]{ title, intro },
  "posts": *[_type == "feedPost"] | order(publishedAt desc){
    _id,
    title,
    category,
    publishedAt,
    coverImage,
    body
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
