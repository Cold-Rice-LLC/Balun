/**
 * Site-wide settings. The Live Stream group is global on purpose: one
 * streamer, live for every market at once — the per-market live pages only
 * carry their editorial overlay. Mux's webhook flips Live Now (see
 * docs/live-streaming.md).
 */
export default {
  name: 'siteSettings',
  type: 'document',
  title: 'Site Settings',
  fieldsets: [
    {
      name: 'liveStream',
      title: 'Live Stream',
      description:
        'The Mux live stream the Live page plays, for every market. Mux tells the site when it starts and stops.',
      options: {collapsible: true, collapsed: false},
    },
  ],
  fields: [
    {
      name: 'siteTitle',
      type: 'string',
      title: 'Site Title',
      description:
        'Intended for the browser tab and search results. Not wired up on the site yet — page titles are set in code for now.',
    },
    {
      name: 'metaDescription',
      type: 'text',
      title: 'Meta Description',
      rows: 3,
      description:
        'Intended as the site-wide fallback for search-result snippets. Not wired up on the site yet.',
    },
    {
      name: 'ogImage',
      type: 'image',
      title: 'OG Image',
      description:
        'Intended as the preview image when a link to the site is shared. Not wired up on the site yet.',
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
      name: 'muxPlaybackId',
      type: 'string',
      title: 'Mux Playback ID',
      description: "The live stream's playback ID in Mux — what the Live page plays.",
      fieldset: 'liveStream',
    },
    {
      name: 'muxLiveStreamId',
      type: 'string',
      title: 'Mux Live Stream ID',
      description:
        "The live stream's ID in Mux. Mux tells the site when this stream starts and stops, which flips Live Now.",
      fieldset: 'liveStream',
    },
    {
      name: 'isLive',
      type: 'boolean',
      title: 'Live Now',
      description:
        'Flipped automatically by Mux when the stream starts and stops — the Live page shows the player and feed stream cards link to /live while this is on. Change by hand only to override.',
      initialValue: false,
      fieldset: 'liveStream',
    },
  ],
}
