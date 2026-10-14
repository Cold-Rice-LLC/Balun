import {ImageIcon} from '@sanity/icons'

/**
 * Shared field definitions, so repeated fields stay word-for-word identical
 * across schema types.
 */

// Image `alt` subfield. Pass a description where the fallback differs.
export const altField = (
  description = 'Screen-reader description of the image. Leave empty if it is purely decorative.',
) => ({
  name: 'alt',
  type: 'string',
  title: 'Alt Text',
  description,
})

/**
 * Hero-module media: a mediaType radio (image | video) plus the image (with
 * alt) and video fields, each shown and required only for its media type.
 * Spread into `fields`; only the image description varies per module.
 */
export const mediaFields = ({imageDescription}) => [
  {
    name: 'mediaType',
    type: 'string',
    title: 'Media Type',
    description: 'Image or a silent looping video.',
    options: {
      list: [
        {title: 'Image', value: 'image'},
        {title: 'Video', value: 'video'},
      ],
      layout: 'radio',
    },
    initialValue: 'image',
    validation: (Rule) => Rule.required(),
  },
  {
    name: 'image',
    type: 'image',
    title: 'Image',
    description: imageDescription,
    options: {hotspot: true},
    fields: [altField()],
    hidden: ({parent}) => parent?.mediaType !== 'image',
    validation: (Rule) =>
      Rule.custom((value, context) =>
        context.parent?.mediaType === 'image' && !value?.asset ? 'Image is required.' : true,
      ),
  },
  {
    name: 'video',
    type: 'file',
    title: 'Video',
    description: 'Plays as a silent loop.',
    options: {accept: 'video/*'},
    hidden: ({parent}) => parent?.mediaType !== 'video',
    validation: (Rule) =>
      Rule.custom((value, context) =>
        context.parent?.mediaType === 'video' && !value?.asset ? 'Video is required.' : true,
      ),
  },
]

// Hero-module layout: Full Width (edge to edge) or Contained (inset panel).
export const styleField = (description) => ({
  name: 'style',
  type: 'string',
  title: 'Style',
  description,
  options: {
    list: [
      {title: 'Full Width', value: 'fullWidth'},
      {title: 'Contained', value: 'contained'},
    ],
    layout: 'radio',
  },
  initialValue: 'fullWidth',
  validation: (Rule) => Rule.required(),
})

/**
 * A module holding a single required image (with alt), previewed by its alt
 * text. Feed and info pages each register one under their own type name.
 */
export const imageModule = ({name, imageDescription}) => ({
  name,
  type: 'object',
  title: 'Image',
  icon: ImageIcon,
  fields: [
    {
      name: 'image',
      type: 'image',
      title: 'Image',
      description: imageDescription,
      options: {hotspot: true},
      fields: [altField()],
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: {media: 'image', alt: 'image.alt'},
    prepare({media, alt}) {
      return {title: alt || 'Image', subtitle: 'Image module', media}
    },
  },
})
