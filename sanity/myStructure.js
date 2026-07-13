import {
  CogIcon,
  HomeIcon,
  InfoOutlineIcon,
  ThLargeIcon,
  PlayIcon,
  DocumentsIcon,
  TagIcon,
  DocumentTextIcon,
} from '@sanity/icons'

// Singleton document types: edited as a single fixed document, not a list.
// homePage is intentionally NOT a singleton — it's a default page plus optional
// per-market override pages (see homePage schema / adding-a-market.md).
export const singletonTypes = ['siteSettings', 'infoPage', 'feedPage', 'livePage']

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
              // Home pages: the default + any per-market override pages.
              S.listItem()
                .title('Home Pages')
                .icon(HomeIcon)
                .child(
                  S.documentTypeList('homePage')
                    .title('Home Pages')
                    .defaultOrdering([{field: 'market', direction: 'asc'}]),
                ),
              singleton(S, 'infoPage', 'Info Page', InfoOutlineIcon),
              singleton(S, 'livePage', 'Live Page', PlayIcon),
            ]),
        ),
      // Collections (custom titles; schema type titles stay singular for the editor UI).
      // Products/collections are synced from Shopify by Sanity Connect.
      // productVariant docs exist in the dataset but are deliberately not
      // listed here — they're only referenced from product.store.variants.
      S.listItem().title('Products').icon(TagIcon).child(
        S.documentTypeList('product')
          .title('Products')
          .filter('_type == "product" && store.isDeleted != true')
          // No "+" create button — docs are created by the Shopify sync only.
          .initialValueTemplates([]),
      ),
      S.listItem()
        .title('Collections')
        .icon(ThLargeIcon)
        .child(
          S.documentTypeList('collection')
            .title('Collections')
            .filter('_type == "collection" && store.isDeleted != true')
            .initialValueTemplates([]),
        ),
      S.documentTypeListItem('feedPost').title('Feed').icon(DocumentTextIcon),
      singleton(S, 'siteSettings', 'Site Settings', CogIcon),
    ])
