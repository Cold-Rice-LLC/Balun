import {BlockElementIcon} from '@sanity/icons'
import {englishIfAny, requireEnglish} from '../lib/i18nValidation'

/**
 * Home page module: a media hero with a large yellow headline over the media
 * and a row of links pinned to the bottom. Full Width bleeds edge to edge;
 * Contained insets the media into a rounded panel, matching Big Image +
 * Logo. Media is an image or an uploaded video (autoplaying muted loop).
 * Headline and link labels are language-axis (internationalized arrays);
 * link targets reuse linkTarget (internal path or external URL).
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
        'Cover-cropped to fill the module, so landscape works best. Set the hotspot to choose what stays visible when it is cropped.',
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
              description: 'The link text.',
              validation: requireEnglish,
            },
            {
              name: 'link',
              type: 'linkTarget',
              title: 'Link',
              description: 'Where the label links to.',
            },
          ],
          preview: {
            select: {
              label: 'label.0.value',
              internalPath: 'link.internalPath',
              externalUrl: 'link.externalUrl',
              linkType: 'link.linkType',
            },
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
    {
      name: 'style',
      type: 'string',
      title: 'Style',
      description:
        'Full Width bleeds edge to edge; Contained insets the media into a rounded panel (matches Big Image + Logo).',
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
    select: {media: 'image', headline: 'headline.0.value', style: 'style', mediaType: 'mediaType'},
    prepare({media, headline, style, mediaType}) {
      return {
        title: headline || 'Big Image + Headline',
        subtitle: `${style === 'contained' ? 'Contained' : 'Full width'} · ${mediaType === 'video' ? 'video' : 'image'}`,
        media,
      }
    },
  },
}
