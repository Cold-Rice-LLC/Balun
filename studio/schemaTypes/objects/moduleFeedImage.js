import {ImageIcon} from '@sanity/icons'

/**
 * Feed detail module: a single full-width image. (Video is the shared
 * click-to-play `moduleVideo`, offered alongside this in the post's modules.)
 */
export default {
  name: 'moduleFeedImage',
  type: 'object',
  title: 'Image',
  icon: ImageIcon,
  fields: [
    {
      name: 'image',
      type: 'image',
      title: 'Image',
      description: 'Shown at the full width of the post, at its own aspect ratio.',
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          description:
            'Screen-reader description of the image. Leave empty if it is purely decorative.',
        },
      ],
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
