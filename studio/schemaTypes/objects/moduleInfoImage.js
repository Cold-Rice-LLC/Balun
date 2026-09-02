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
      description:
        'Rounded-corner image centered at half the page width on desktop (full width on phones), at its own aspect ratio.',
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
