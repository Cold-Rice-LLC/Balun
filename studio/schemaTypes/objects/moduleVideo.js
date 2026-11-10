import {PlayIcon} from '@sanity/icons'
import {englishIfAny} from '../lib/i18nValidation'
import {youtubeUrlRule} from '../lib/youtube'
import {vimeoUrlRule} from '../lib/vimeo'
import {altField, mobileImageField} from '../lib/fields'

/**
 * Home page module: a click-to-play video in the headline-over-image media
 * geometry (centered, rounded, 16:9). The poster shows a "watch" pill and
 * fades out on click; the video is a Mux upload (short pieces) or a Vimeo
 * or YouTube embed (long-form).
 */
export default {
  name: 'moduleVideo',
  type: 'object',
  title: 'Video',
  icon: PlayIcon,
  fields: [
    {
      name: 'videoType',
      type: 'string',
      title: 'Video Type',
      description: 'Upload short video to Mux, or embed long-form video from Vimeo or YouTube.',
      options: {
        list: [
          {title: 'Upload (Mux)', value: 'mux'},
          {title: 'Vimeo', value: 'vimeo'},
          {title: 'YouTube', value: 'youtube'},
        ],
        layout: 'radio',
      },
      initialValue: 'mux',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'video',
      type: 'mux.video',
      title: 'Video',
      description: 'Plays with sound and controls once the poster is clicked. Uploads go to Mux.',
      hidden: ({parent}) => parent?.videoType !== 'mux',
      validation: (Rule) =>
        Rule.custom((value, context) =>
          context.parent?.videoType === 'mux' && !value?.asset ? 'Video is required.' : true,
        ),
    },
    {
      name: 'vimeoUrl',
      type: 'url',
      title: 'Vimeo URL',
      description: 'Any Vimeo link — public, unlisted (with its private hash) or player embed.',
      hidden: ({parent}) => parent?.videoType !== 'vimeo',
      validation: vimeoUrlRule((context) => context.parent?.videoType === 'vimeo'),
    },
    {
      name: 'youtubeUrl',
      type: 'url',
      title: 'YouTube URL',
      description: 'Any YouTube link — watch, share (youtu.be) or embed.',
      hidden: ({parent}) => parent?.videoType !== 'youtube',
      validation: youtubeUrlRule((context) => context.parent?.videoType === 'youtube'),
    },
    {
      name: 'buttonText',
      type: 'internationalizedArrayString',
      title: 'Button Text',
      description: 'Label on the play pill. Leave empty for "watch".',
      validation: englishIfAny,
    },
    {
      name: 'poster',
      type: 'image',
      title: 'Poster',
      description: 'Shown with the "watch" pill until the video is played.',
      options: {hotspot: true},
      fields: [altField()],
      validation: (Rule) => Rule.required(),
    },
    mobileImageField({
      name: 'mobilePoster',
      title: 'Mobile Poster',
      description:
        'Optional poster for phones (under 768px wide). Falls back to the main poster when empty.',
      hidden: false,
    }),
  ],
  preview: {
    select: {
      media: 'poster',
      videoType: 'videoType',
      vimeoUrl: 'vimeoUrl',
      youtubeUrl: 'youtubeUrl',
    },
    prepare({media, videoType, vimeoUrl, youtubeUrl}) {
      const subtitle = {
        mux: 'Mux upload',
        vimeo: vimeoUrl || 'Vimeo',
        youtube: youtubeUrl || 'YouTube',
      }[videoType]
      return {title: 'Video', subtitle, media}
    },
  },
}
