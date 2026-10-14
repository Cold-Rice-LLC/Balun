import {BlockElementIcon} from '@sanity/icons'
import {englishIfAny, requireEnglish} from '../lib/i18nValidation'
import {linkTargetSelect, linkTargetSubtitle} from './linkTarget'
import {mediaFields, styleField} from '../lib/fields'

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
    ...mediaFields({
      imageDescription:
        'Cover-cropped to fill the module, so landscape works best. Set the hotspot to choose what stays visible when it is cropped.',
    }),
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
              // The site drops a row with no destination, so a label saved
              // without one would never show.
              validation: (Rule) =>
                Rule.custom((link) =>
                  ['internal', 'external'].includes(link?.linkType)
                    ? true
                    : 'Choose where this goes, or remove the row.',
                ),
            },
          ],
          preview: {
            select: {label: 'label.0.value', ...linkTargetSelect('link.')},
            prepare: ({label, ...link}) => ({
              title: label || 'Link',
              subtitle: linkTargetSubtitle(link),
            }),
          },
        },
      ],
    },
    styleField(
      'Full Width bleeds edge to edge; Contained insets the media into a rounded panel (matches Big Image + Logo).',
    ),
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
