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
