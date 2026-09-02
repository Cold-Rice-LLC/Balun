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
      description: 'Reserved for a page heading — nothing on the site renders it yet.',
    },
  ],
}
