// Central GROQ queries so they're reusable and easy to eyeball/test.
import { groq } from '#imports'

// Shared product projection — Sanity supplemental fields only.
// TODO(shopify): merge live Shopify data (title/price/images) by `shopifyGid` at render time.
const productProjection = `
  _id,
  internalTitle,
  shopifyGid,
  shopifyHandle,
  tagline,
  gallery
`

export const homeQuery = groq`*[_type == "homePage"][0]{
  featuredProducts[]->{${productProjection}}
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
