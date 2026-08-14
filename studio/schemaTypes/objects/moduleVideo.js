import {PlayIcon} from '@sanity/icons'

// Matches watch?v=, youtu.be/, shorts/ and embed/ URLs; group 1 is the ID.
const YOUTUBE_ID_PATTERN = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/

/**
 * Home page module: a click-to-play video in the headline-over-image media
 * geometry (centered, rounded, 16:9). The poster shows a "watch" pill and
 * fades out on click; the video is an uploaded MP4 or a YouTube embed.
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
      options: {
        list: [
          {title: 'MP4 Upload', value: 'mp4'},
          {title: 'YouTube', value: 'youtube'},
        ],
        layout: 'radio',
      },
      initialValue: 'mp4',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'video',
      type: 'file',
      title: 'Video',
      description: 'Plays with sound and controls once the poster is clicked.',
      options: {accept: 'video/mp4'},
      hidden: ({parent}) => parent?.videoType !== 'mp4',
      validation: (Rule) =>
        Rule.custom((value, context) =>
          context.parent?.videoType === 'mp4' && !value?.asset ? 'Video is required.' : true,
        ),
    },
    {
      name: 'youtubeUrl',
      type: 'url',
      title: 'YouTube URL',
      description: 'Any YouTube link — watch, share (youtu.be) or embed.',
      hidden: ({parent}) => parent?.videoType !== 'youtube',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.parent?.videoType !== 'youtube') return true
          if (!value) return 'YouTube URL is required.'
          return YOUTUBE_ID_PATTERN.test(value) ? true : 'Not a recognizable YouTube video URL.'
        }),
    },
    {
      name: 'poster',
      type: 'image',
      title: 'Poster',
      description: 'Shown with the "watch" pill until the video is played.',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt Text'}],
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: {media: 'poster', videoType: 'videoType', youtubeUrl: 'youtubeUrl'},
    prepare({media, videoType, youtubeUrl}) {
      return {
        title: 'Video',
        subtitle: videoType === 'youtube' ? youtubeUrl || 'YouTube' : 'MP4 upload',
        media,
      }
    },
  },
}
