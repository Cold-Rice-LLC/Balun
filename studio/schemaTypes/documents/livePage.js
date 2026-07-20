import {PlayIcon} from '@sanity/icons'

// Placeholder — real fields TBD.
export default {
  name: 'livePage',
  type: 'document',
  title: 'Live Page',
  icon: PlayIcon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
  ],
}
