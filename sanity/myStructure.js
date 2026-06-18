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
export const singletonTypes = ['siteSettings', 'homePage', 'infoPage', 'feedPage', 'livePage']

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
              singleton(S, 'homePage', 'Home Page', HomeIcon),
              singleton(S, 'feedPage', 'Feed Page', ThLargeIcon),
              singleton(S, 'infoPage', 'Info Page', InfoOutlineIcon),
              singleton(S, 'livePage', 'Live Page', PlayIcon),
            ]),
        ),
      // Collections (custom titles; schema type titles stay singular for the editor UI).
      S.documentTypeListItem('product').title('Products').icon(TagIcon),
      S.documentTypeListItem('feedPost').title('Feed').icon(DocumentTextIcon),
      singleton(S, 'siteSettings', 'Site Settings', CogIcon),
    ])
