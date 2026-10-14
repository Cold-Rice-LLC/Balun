import {ImageIcon} from '@sanity/icons'
import {requireEnglish, requireEnglishWhen} from '../lib/i18nValidation'
import {altField, mediaFields} from '../lib/fields'

// The caption link only renders once the editor has picked where it goes.
const hasLink = (module) => ['internal', 'external'].includes(module?.link?.linkType)

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
    ...mediaFields({
      imageDescription:
        'Shown at about half the window width, centered, with the headline overlapping it. Set the hotspot to choose what stays visible when it is cropped.',
    }),
    {
      name: 'mobileImage',
      type: 'image',
      title: 'Mobile Image',
      description: 'Optional portrait image for phones. Falls back to the main image when empty.',
      options: {hotspot: true},
      fields: [altField()],
      hidden: ({parent}) => parent?.mediaType !== 'image',
    },
    {
      name: 'headline',
      type: 'internationalizedArrayString',
      title: 'Headline',
      description: 'Large yellow headline overlapping the media.',
      validation: requireEnglish,
    },
    {
      name: 'link',
      type: 'linkTarget',
      title: 'Link',
      description:
        'Optional caption-style link under the media. None for no link; pick a page or URL to add one and give it a label.',
    },
    {
      name: 'linkLabel',
      type: 'internationalizedArrayString',
      title: 'Link Label',
      description: 'The caption\'s text (e.g. "The world\'s fastest shoe").',
      hidden: ({parent}) => !hasLink(parent),
      validation: requireEnglishWhen(({parent}) => hasLink(parent)),
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
