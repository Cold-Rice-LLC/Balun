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
      description:
        'Cover-cropped to fill the module, so landscape works best. Set the hotspot to choose what stays visible when it is cropped. The balun wordmark is overlaid near the bottom.',
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
      description:
        'Full Width bleeds edge to edge with a white wordmark; Contained insets the media into a rounded-top panel with a yellow wordmark.',
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
