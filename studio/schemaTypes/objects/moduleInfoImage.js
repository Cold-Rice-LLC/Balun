import {ImageIcon} from '@sanity/icons'

/**
 * Info page module: a single image (6 of 12 grid columns).
 */
export default {
  name: 'moduleInfoImage',
  type: 'object',
  title: 'Image',
  icon: ImageIcon,
  fields: [
    {
      name: 'image',
      type: 'image',
      title: 'Image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt Text'}],
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: {media: 'image', alt: 'image.alt'},
    prepare({media, alt}) {
      return {title: alt || 'Image', subtitle: 'Image module', media}
    },
  },
}
