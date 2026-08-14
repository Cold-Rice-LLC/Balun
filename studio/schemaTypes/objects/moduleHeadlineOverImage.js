import {ImageIcon} from '@sanity/icons'
import {englishIfAny, requireEnglish} from '../lib/i18nValidation'

/**
 * Home page module: a full-viewport panel with the media inset to about half
 * the window width (rounded, centered) and a large yellow headline spanning
 * the window, overlapping the media at its center. An optional caption-style
 * link sits under the media. Media is an image or an uploaded video
 * (autoplaying muted loop).
 */
export default {
  name: 'moduleHeadlineOverImage',
  type: 'object',
  title: 'Headline Over Image',
  icon: ImageIcon,
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
      name: 'headline',
      type: 'internationalizedArrayString',
      title: 'Headline',
      description: 'Large yellow headline overlapping the media.',
      validation: requireEnglish,
    },
    {
      name: 'linkLabel',
      type: 'internationalizedArrayString',
      title: 'Link Label',
      description: 'Optional caption-style link under the media (e.g. "The world\'s fastest shoe").',
      validation: englishIfAny,
    },
    {
      name: 'link',
      type: 'linkTarget',
      title: 'Link',
      description: 'Where the caption links. The caption only renders with both a label and a target.',
    },
  ],
  preview: {
    select: {media: 'image', headline: 'headline.0.value', mediaType: 'mediaType'},
    prepare({media, headline, mediaType}) {
      return {
        title: headline || 'Headline Over Image',
        subtitle: `Headline over image · ${mediaType === 'video' ? 'video' : 'image'}`,
        media,
      }
    },
  },
}
