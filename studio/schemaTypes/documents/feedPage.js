import {ThLargeIcon} from '@sanity/icons'

// Container for the Feed page. Posts themselves are `feedPost` documents.
export default {
  name: 'feedPage',
  type: 'document',
  title: 'Feed Page',
  icon: ThLargeIcon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
  ],
}
