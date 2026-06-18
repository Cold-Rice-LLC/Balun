import {HomeIcon} from '@sanity/icons'

export default {
  name: 'homePage',
  type: 'document',
  title: 'Home Page',
  icon: HomeIcon,
  fields: [
    {
      name: 'featuredProducts',
      type: 'array',
      title: 'Featured Products',
      of: [{type: 'reference', to: [{type: 'product'}]}],
    },
    // Hero / additional home fields stubbed for a later pass.
  ],
  preview: {
    prepare: () => ({title: 'Home'}),
  },
}
