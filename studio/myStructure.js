import {
  CogIcon,
  HomeIcon,
  InfoOutlineIcon,
  PlayIcon,
  DocumentsIcon,
  TagIcon,
  DocumentTextIcon,
} from '@sanity/icons'

// Singleton document types: edited as a single fixed document, not a list.
// homePage/infoPage/livePage/legalPage are intentionally NOT singletons — each
// is a default page plus optional per-market override pages (see the marketField
// helper / adding-a-market.md).
export const singletonTypes = ['siteSettings', 'feedPage']

// Helper to build a singleton list item with a fixed document id.
const singleton = (S, schemaType, title, icon) =>
  S.listItem()
    .title(title)
    .icon(icon)
    .child(S.document().schemaType(schemaType).documentId(schemaType))

export const myStructure = (S) =>
  S.list()
    .title('Content')
    .items([
      // One-off pages grouped together.
      S.listItem()
        .title('Pages')
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title('Pages')
            .items([
              // Each page type: the default + any per-market override pages.
              // Ordering by market puts the default (no market) first.
              S.listItem()
                .title('Home Pages')
                .icon(HomeIcon)
                .child(
                  S.documentTypeList('homePage')
                    .title('Home Pages')
                    .defaultOrdering([{field: 'market', direction: 'asc'}]),
                ),
              S.listItem()
                .title('Info Pages')
                .icon(InfoOutlineIcon)
                .child(
                  S.documentTypeList('infoPage')
                    .title('Info Pages')
                    .defaultOrdering([{field: 'market', direction: 'asc'}]),
                ),
              S.listItem()
                .title('Live Pages')
                .icon(PlayIcon)
                .child(
                  S.documentTypeList('livePage')
                    .title('Live Pages')
                    .defaultOrdering([{field: 'market', direction: 'asc'}]),
                ),
              // Reusable policy pages: Terms, Returns, Privacy, … (slug-driven,
              // market variants of the same slug grouped together).
              S.listItem()
                .title('Legal Pages')
                .icon(DocumentTextIcon)
                .child(
                  S.documentTypeList('legalPage')
                    .title('Legal Pages')
                    .defaultOrdering([
                      {field: 'slug.current', direction: 'asc'},
                      {field: 'market', direction: 'asc'},
                    ]),
                ),
            ]),
        ),
      // Collections (custom titles; schema type titles stay singular for the editor UI).
      // Products/collections are synced from Shopify by Sanity Connect.
      // productVariant and collection docs exist in the dataset but are
      // deliberately not listed here — variants are only referenced from
      // product.store.variants, and collections aren't used by the site yet
      // (the schema stays registered so Connect keeps syncing them; add a
      // documentTypeList('collection') item back here when they're needed).
      S.listItem().title('Products').icon(TagIcon).child(
        S.documentTypeList('product')
          .title('Products')
          .filter('_type == "product" && store.isDeleted != true')
          // No "+" create button — docs are created by the Shopify sync only.
          .initialValueTemplates([]),
      ),
      S.documentTypeListItem('feedPost').title('Feed').icon(DocumentTextIcon),
      singleton(S, 'siteSettings', 'Site Settings', CogIcon),
    ])
