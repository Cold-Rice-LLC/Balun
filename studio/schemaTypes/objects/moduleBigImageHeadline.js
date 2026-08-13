import {BlockElementIcon} from '@sanity/icons'
import {englishIfAny, requireEnglish} from '../lib/i18nValidation'

/**
 * Home page module: a full-bleed media hero with a large yellow headline
 * over the media and a row of links pinned to the bottom. Media is an image
 * or an uploaded video (autoplaying muted loop). Headline and link labels
 * are language-axis (internationalized arrays); link targets reuse
 * linkTarget (internal path or external URL).
 */
export default {
  name: 'moduleBigImageHeadline',
  type: 'object',
  title: 'Big Image + Headline',
  icon: BlockElementIcon,
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
      description: 'Large yellow headline over the media.',
      validation: englishIfAny,
    },
    {
      name: 'links',
      type: 'array',
      title: 'Links',
      description: 'Row of links along the bottom of the module.',
      of: [
        {
          type: 'object',
          name: 'headlineLink',
          title: 'Link',
          fields: [
            {
              name: 'label',
              type: 'internationalizedArrayString',
              title: 'Label',
              validation: requireEnglish,
            },
            {
              name: 'link',
              type: 'linkTarget',
              title: 'Link',
            },
          ],
          preview: {
            select: {label: 'label.0.value', internalPath: 'link.internalPath', externalUrl: 'link.externalUrl', linkType: 'link.linkType'},
            prepare({label, internalPath, externalUrl, linkType}) {
              return {
                title: label || 'Link',
                subtitle: linkType === 'external' ? `↗ ${externalUrl || ''}` : internalPath || '',
              }
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {media: 'image', headline: 'headline.0.value', mediaType: 'mediaType'},
    prepare({media, headline, mediaType}) {
      return {
        title: headline || 'Big Image + Headline',
        subtitle: `Big image + headline · ${mediaType === 'video' ? 'video' : 'image'}`,
        media,
      }
    },
  },
}
