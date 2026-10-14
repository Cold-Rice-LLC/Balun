// Central GROQ queries so they're reusable and easy to eyeball/test.
import { groq } from '#imports'

// Translated fields are internationalized arrays: resolve the current $lang
// with an English fallback so untranslated fields still render. Every query
// that embeds this must be fetched with a $lang param.
const i18nField = (name: string) =>
  `"${name}": coalesce(${name}[language == $lang][0].value, ${name}[language == "en"][0].value)`

// An internal link's referenced document, dereferenced to the type-and-slug
// shape internalLinkPath resolves to a route — no stored paths anywhere.
// Products keep their slug under the synced store object.
const internalLinkProjection = `"internal": internalLink->{_type, "slug": coalesce(slug.current, store.slug.current)}`

// A link destination (linkTarget fields, on their own or inside navLink /
// labeledLink).
const linkTargetProjection = `
  linkType,
  ${internalLinkProjection},
  externalUrl
`

// A translated rich text field with its link marks resolved: `...` keeps
// each block as-is; the conditional adds the referenced document behind an
// internal link, in the same shape linkTargetProjection produces so
// internalLinkPath routes both (RichText renders them).
const i18nRichText = (name: string) => {
  const marks = `[]{
    ...,
    markDefs[]{
      ...,
      _type == "link" => {${internalLinkProjection}}
    }
  }`
  return `"${name}": coalesce(${name}[language == $lang][0].value${marks}, ${name}[language == "en"][0].value${marks})`
}

// An OPTIONAL link only counts once it points somewhere: an editor who
// picked None (or never chose) has no link, so it nulls out here and the
// components' no-link branches take over.
const optionalLinkProjection = `"link": select(
  link.linkType in ["internal", "external"] => link{${linkTargetProjection}}
)`

// The click-to-play video module, shared by the home and info page builders.
// File assets have no ref-encoded URL, so the video dereferences here.
const moduleVideoProjection = `
  videoType,
  "videoUrl": video.asset->url,
  youtubeUrl,
  ${i18nField('buttonText')},
  poster
`

// Shared product projection. Product docs are synced by Sanity Connect:
// identity/title/slug live under the machine-owned `store` object (flattened
// here so components don't care), editorial fields are siblings. Live market
// price/stock still comes from /api/products by gid at render time.
const productProjection = `
  _id,
  "title": store.title,
  "gid": store.gid,
  "slug": store.slug.current,
  ${i18nField('tagline')},
  featuredImage,
  gallery
`

// A product's feature carousel slides (shared by the home featured-product
// module and the PDP), with each highlight's text resolved.
const featureCarouselProjection = `[]{
  ...,
  highlights[]{
    ${i18nField('text')},
    xPosition,
    yPosition,
    textPosition,
    side,
    width
  }
}`

// Hero-module media: images keep the raw ref (useSanityImage builds the CDN
// URL); file assets have no ref-encoded URL, so videos dereference here.
const heroMediaProjection = `
  mediaType,
  image,
  "videoUrl": video.asset->url
`

// A page's SEO overrides from the Studio (see the `seo` object): each field
// may be empty, and useSeo falls back to the page's own content, then Site
// Settings.
const seoProjection = `"seo": seo{
  ${i18nField('title')},
  ${i18nField('description')},
  image
}`

// A singleton that's market-scoped at the DOCUMENT level
// (docs/shopify-and-localization-strategy.md §3, document Pattern B): this
// market's document if it exists, else the default (no market). Ordering
// defined(market) first means the market-specific one wins; [0] takes it, and
// falls through to the default otherwise. `filter` narrows further (e.g. by slug).
const marketDoc = (type: string, filter = '') =>
  `*[_type == "${type}"${filter} && (market == $market || !defined(market))] | order(defined(market) desc)[0]`

const siteSettings = `*[_type == "siteSettings"][0]`

// The home page is modular (page builder) and market-scoped at the document
// level (marketDoc); each market URL caches its own shell.
//
// Modules project per-type. Product references are filtered to still-sellable
// items (buy-box null-handling covers any a market's catalog omits).
export const homeQuery = groq`${marketDoc('homePage')}{
  "modules": modules[]{
    _type,
    _key,
    _type == "moduleProductGrid" => {
      "products": products[@->store.status == "active" && @->store.isDeleted != true]->{${productProjection}}
    },
    _type == "moduleFeaturedProduct" => {
      ${i18nField('heading')},
      ${i18nField('subheading')},
      "product": product->{${productProjection}},
      // Slides live on the product (featureCarousel, shared with the PDP);
      // none entered = no carousel (the component hides it).
      "images": product->featureCarousel${featureCarouselProjection}
    },
    _type == "moduleMarquee" => {
      "texts": texts[]{${i18nField('text')}}.text,
      ${optionalLinkProjection}
    },
    _type == "moduleBigImageLogo" => {
      ${heroMediaProjection},
      style
    },
    _type == "moduleBigImageHeadline" => {
      ${heroMediaProjection},
      ${i18nField('headline')},
      links[]{
        _key,
        ${i18nField('label')},
        ${optionalLinkProjection}
      },
      style
    },
    _type == "moduleHeadlineOverImage" => {
      ${heroMediaProjection},
      mobileImage,
      ${i18nField('headline')},
      ${i18nField('linkLabel')},
      ${optionalLinkProjection}
    },
    _type == "moduleVideo" => {${moduleVideoProjection}}
  },
  ${seoProjection}
}`

// Modular; the title only feeds the tab title. Market-scoped at the document
// level like home.
export const infoQuery = groq`${marketDoc('infoPage')}{
  ${i18nField('title')},
  "modules": modules[]{
    _type,
    _key,
    _type == "moduleInfoText" => {
      ${i18nField('text')}
    },
    _type == "moduleInfoImage" => {
      image
    },
    _type == "moduleInfoProse" => {
      ${i18nRichText('body')}
    },
    _type == "moduleVideo" => {${moduleVideoProjection}}
  },
  ${seoProjection}
}`

// A reusable policy page by slug. Title/body are internationalized arrays
// (sanity-plugin-internationalized-array): resolve the current $lang, falling
// back to English so an untranslated page still renders. Slug is language-
// agnostic — the {lang} URL prefix carries language, not the path. Market-
// scoped at the document level like home, per slug.
export const legalPageQuery = groq`${marketDoc('legalPage', ' && slug.current == $slug')}{
  ${i18nField('title')},
  ${i18nRichText('body')},
  ${seoProjection}
}`

export const FEED_PAGE_SIZE = 12

const feedPostProjection = `
  _id,
  ${i18nField('title')},
  "slug": slug.current,
  category,
  publishedAt,
  coverImage,
  "bgColor": cardBackground.hex,
  ${i18nField('excerpt')},
  link,
  "recapVideo": recapVideo{${moduleVideoProjection}},
  "modules": modules[]{
    _type,
    _key,
    _type == "moduleFeedText" => {${i18nRichText('body')}},
    _type == "moduleFeedImage" => {image},
    _type == "moduleVideo" => {${moduleVideoProjection}},
    _type == "moduleFeedLinks" => {
      links[]{
        _key,
        ${i18nField('label')},
        ${linkTargetProjection}
      }
    }
  }
`

// Feed posts page by cursor, newest first with _id as the tiebreaker so two
// posts sharing a timestamp can't repeat or vanish across a page boundary.
// $category narrows to one category (null = all). Both queries over-fetch by
// one row: the extra is the has-more probe, trimmed before render.
const feedPostFilter = `_type == "feedPost" && ($category == null || category == $category)`
const feedPostOrder = `order(publishedAt desc, _id asc) [0...${FEED_PAGE_SIZE + 1}]`

export const feedQuery = groq`{
  "isLive": ${siteSettings}.isLive == true,
  "posts": *[${feedPostFilter}] | ${feedPostOrder} { ${feedPostProjection} }
}`

// Pages after the first: everything strictly past the last rendered post
// ($cursorDate/$cursorId = its publishedAt/_id).
export const feedPostsQuery = groq`*[
  ${feedPostFilter}
  && (publishedAt < $cursorDate || (publishedAt == $cursorDate && _id > $cursorId))
] | ${feedPostOrder} { ${feedPostProjection} }`

// One post for the feed detail, by slug.
export const feedPostQuery = groq`*[_type == "feedPost" && slug.current == $slug][0]{
  ${feedPostProjection},
  ${seoProjection}
}`

// Market-scoped at the document level like home.
export const liveQuery = groq`${marketDoc('livePage')}{
  ${i18nField('location')},
  ${i18nField('description')},
  "featuredProduct": featuredProduct->{${productProjection}},
  // The stream is global (one streamer, every market): from Site Settings.
  // Older settings predate the source picker, so they mean Mux.
  "liveSource": coalesce(${siteSettings}.liveSource, "mux"),
  "muxPlaybackId": ${siteSettings}.muxPlaybackId,
  "youtubeUrl": ${siteSettings}.youtubeUrl,
  "isLive": ${siteSettings}.isLive == true,
  ${seoProjection}
}`

// Site-wide live status for the nav's live tab: whether the stream is on
// (Site Settings, flipped by Mux's webhook) and this market's live page
// location label ("Live from Tokyo"), resolved like liveQuery.
export const liveStatusQuery = groq`{
  "isLive": ${siteSettings}.isLive == true,
  "location": ${marketDoc('livePage')}{${i18nField('location')}}.location
}`

// PDP editorial shell: one product by its Shopify handle (synced slug).
// Live commerce data (variants/price/stock) comes from /api/product, not here.
// `tags` is exposed so the page can parse the colorway group tag (group:<slug>).
export const productPageQuery = groq`*[
  _type == "product" && store.slug.current == $handle && store.isDeleted != true
][0]{
  "title": store.title,
  "gid": store.gid,
  "tags": store.tags,
  ${i18nField('tagline')},
  ${i18nRichText('body')},
  featuredImage,
  gallery,
  featureCarousel${featureCarouselProjection},
  ${seoProjection}
}`

// Colorway group members: products sharing the group:<slug> Shopify tag (see
// docs/shopify-and-localization-strategy.md §4), INCLUDING the current
// product — the PDP marks it as current in the rail rather than hiding it.
// $groupTag == "" (product has no group tag) matches nothing, so callers can
// pass it unconditionally.
export const colorwaysQuery = groq`*[
  _type == "product"
  && $groupTag != ""
  && $groupTag in string::split(store.tags, ", ")
  && store.status == "active"
  && store.isDeleted != true
] | order(store.title asc) {
  _id,
  "title": store.title,
  "slug": store.slug.current,
  "gid": store.gid,
  featuredImage,
  gallery
}`

// Shared nav-link projection — used by both footer link lists.
const navLinkProjection = `
  label,
  ${linkTargetProjection}
`

// Site-wide settings: the SEO fallbacks (useSeo) and the footer's link lists.
// The meta description is translated, so this takes $lang.
export const siteSettingsQuery = groq`${siteSettings}{
  siteTitle,
  ${i18nField('metaDescription')},
  ogImage,
  footerPrimaryLinks[]{${navLinkProjection}},
  footerSecondaryLinks[]{${navLinkProjection}}
}`
