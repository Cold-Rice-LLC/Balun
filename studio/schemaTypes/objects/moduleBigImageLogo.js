import {ImagesIcon} from '@sanity/icons'
import {mediaFields, styleField} from '../lib/fields'

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
    ...mediaFields({
      imageDescription:
        'Cover-cropped to fill the module, so landscape works best. Set the hotspot to choose what stays visible when it is cropped. The balun wordmark is overlaid near the bottom.',
    }),
    styleField(
      'Full Width bleeds edge to edge with a white wordmark; Contained insets the media into a rounded-top panel with a yellow wordmark.',
    ),
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
