import {InfoOutlineIcon} from '@sanity/icons'

// Placeholder — real fields TBD.
export default {
  name: 'infoPage',
  type: 'document',
  title: 'Info Page',
  icon: InfoOutlineIcon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
  ],
}
