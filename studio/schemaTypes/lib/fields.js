import {ImageIcon} from '@sanity/icons'
import {englishIfAny} from './i18nValidation'

/**
 * Shared field definitions, so repeated fields stay word-for-word identical
 * across schema types.
 */

// Image `alt` subfield, translated like every other editorial string (the
// front end resolves it per $lang with the English fallback). Optional, but
// a translation without English would fall back to blank, so English is
// required once any language is filled. Pass a description where the
// fallback differs.
export const altField = (
  description = 'Screen-reader description of the image. Leave empty if it is purely decorative.',
) => ({
  name: 'alt',
  type: 'internationalizedArrayString',
  title: 'Alt Text',
  description,
  validation: englishIfAny,
})

/**
 * An optional phone-only image: the site swaps it in under 768px and falls
 * back to the main image when empty. Hidden unless the module shows an image
 * (video media has no mobile variant); pass `hidden: false` where the image
 * always shows (a video poster).
 */
export const mobileImageField = ({
  name = 'mobileImage',
  title = 'Mobile Image',
  description = 'Optional image for phones (under 768px wide), e.g. a portrait crop. Falls back to the main image when empty.',
  hidden = ({parent}) => parent?.mediaType !== 'image',
} = {}) => ({
  name,
  type: 'image',
  title,
  description,
  options: {hotspot: true},
  fields: [altField()],
  hidden,
})

/**
 * Hero-module media: a mediaType radio (image | video) plus the image (with
 * alt), an optional mobile image, and video fields, each shown only for its
 * media type (image and video required for theirs). Spread into `fields`;
 * only the image description varies per module.
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
  mobileImageField(),
  {
    name: 'video',
    type: 'mux.video',
    title: 'Video',
    description: 'Plays as a silent loop. Uploads go to Mux.',
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
    select: {media: 'image', alt: 'image.alt.0.value'},
    prepare({media, alt}) {
      return {title: alt || 'Image', subtitle: 'Image module', media}
    },
  },
})
