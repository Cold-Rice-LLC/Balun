import {ImagesIcon} from '@sanity/icons'

/**
 * Home page module: a large media hero with the balun wordmark overlaid near
 * the bottom. Full Width bleeds edge to edge (white wordmark); Contained
 * insets the media into a rounded-top panel (yellow wordmark). Media is an
 * image or an uploaded video (autoplaying muted loop).
 */
export default {
  name: 'moduleBigImageLogo',
  type: 'object',
  title: 'Big Image + Logo',
  icon: ImagesIcon,
  fields: [
    {
      name: 'mediaType',
      type: 'string',
      title: 'Media Type',
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
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt Text'}],
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
    {
      name: 'style',
      type: 'string',
      title: 'Style',
      options: {
        list: [
          {title: 'Full Width', value: 'fullWidth'},
          {title: 'Contained', value: 'contained'},
        ],
        layout: 'radio',
      },
      initialValue: 'fullWidth',
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: {media: 'image', style: 'style', mediaType: 'mediaType'},
    prepare({media, style, mediaType}) {
      return {
        title: 'Big Image + Logo',
        subtitle: `${style === 'contained' ? 'Contained' : 'Full width'} · ${mediaType === 'video' ? 'video' : 'image'}`,
        media,
      }
    },
  },
}
