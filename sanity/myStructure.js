import {CogIcon} from '@sanity/icons'

export const myStructure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      ...S.documentTypeListItems().filter(
        (listItem) => !['siteSettings'].includes(listItem.getId()),
      ),
    ])
