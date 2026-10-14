import {englishIfAnyMaxLength} from './lib/i18nValidation'
import {youtubeUrlRule} from './lib/youtube'

/**
 * Site-wide settings. The Live Stream group is global on purpose: one
 * streamer, live for every market at once — the per-market live pages only
 * carry their editorial overlay. Mux's webhook flips Live Now; a YouTube
 * stream has no such signal, so there the toggle is the switch (see
 * docs/live-streaming.md).
 */
export default {
  name: 'siteSettings',
  type: 'document',
  title: 'Site Settings',
  fieldsets: [
    {
      name: 'metadata',
      title: 'Metadata',
      description:
        'What search results and shared links show for any page that doesn’t set its own (each page’s SEO section overrides these).',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'liveStream',
      title: 'Live Stream',
      description:
        'What the Live page plays, for every market. With Mux, the site is told when the stream starts and stops; with YouTube, Live Now is the switch.',
      options: {collapsible: true, collapsed: false},
    },
  ],
  fields: [
    {
      name: 'siteTitle',
      type: 'string',
      title: 'Site Title',
      description:
        'Follows every page’s title (“Feed — Balun”), and is the home page’s title alone.',
      validation: (Rule) => Rule.required(),
      fieldset: 'metadata',
    },
    {
      name: 'metaDescription',
      type: 'internationalizedArrayText',
      title: 'Meta Description',
      description:
        'The search-result snippet and share text for pages with no description of their own.',
      validation: englishIfAnyMaxLength(
        160,
        'Search results cut descriptions off at about 160 characters.',
      ),
      fieldset: 'metadata',
    },
    {
      name: 'ogImage',
      type: 'image',
      title: 'Share Image',
      description:
        'Shown when a link to the site is shared, for pages with no image of their own. Cropped to 1200 × 630 around the hotspot.',
      options: {hotspot: true},
      fieldset: 'metadata',
    },
    {
      name: 'footerPrimaryLinks',
      type: 'array',
      title: 'Footer — Primary Links',
      description: 'The main link list in the footer (e.g. Info, Feed, Live). Drag to reorder.',
      of: [{type: 'navLink'}],
    },
    {
      name: 'footerSecondaryLinks',
      type: 'array',
      title: 'Footer — Secondary Links',
      description:
        'The smaller link list in the footer, for policies and social links. Drag to reorder.',
      of: [{type: 'navLink'}],
    },
    {
      name: 'liveSource',
      type: 'string',
      title: 'Live Source',
      description:
        'Where the Live page plays from. Mux fills the page edge to edge; a YouTube embed sits centered, like the video module elsewhere on the site.',
      options: {
        list: [
          {title: 'Mux', value: 'mux'},
          {title: 'YouTube', value: 'youtube'},
        ],
        layout: 'radio',
      },
      initialValue: 'mux',
      fieldset: 'liveStream',
    },
    {
      name: 'muxPlaybackId',
      type: 'string',
      title: 'Mux Playback ID',
      description: "The live stream's playback ID in Mux — what the Live page plays.",
      hidden: ({document}) => document?.liveSource === 'youtube',
      fieldset: 'liveStream',
    },
    {
      name: 'muxLiveStreamId',
      type: 'string',
      title: 'Mux Live Stream ID',
      description:
        "The live stream's ID in Mux. Mux tells the site when this stream starts and stops, which flips Live Now.",
      hidden: ({document}) => document?.liveSource === 'youtube',
      fieldset: 'liveStream',
    },
    {
      name: 'youtubeUrl',
      type: 'url',
      title: 'YouTube URL',
      description:
        'The broadcast to embed — any YouTube link (watch, share, live or embed). YouTube gives each broadcast its own link, so paste the new one each time you go live.',
      hidden: ({document}) => document?.liveSource !== 'youtube',
      validation: youtubeUrlRule((context) => context.document?.liveSource === 'youtube'),
      fieldset: 'liveStream',
    },
    {
      name: 'isLive',
      type: 'boolean',
      title: 'Live Now',
      description:
        'The Live page shows the stream and feed stream cards link to /live while this is on. With Mux it is flipped automatically as the stream starts and stops — change it by hand only to override. With YouTube nothing tells the site, so turn it on and off yourself.',
      initialValue: false,
      fieldset: 'liveStream',
    },
  ],
}
