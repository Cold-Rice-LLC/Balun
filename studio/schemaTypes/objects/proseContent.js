/**
 * Portable Text for the info page's intermingled text+image module: plain
 * paragraphs whose blocks allow INLINE images — editors drop an image
 * mid-sentence and the front end renders it inside the flowing display text.
 * Deliberately minimal (no headings/lists) — this is display typography,
 * not an article body; `blockContent` stays the article-shaped type.
 */
export default {
  name: 'proseContent',
  type: 'array',
  title: 'Prose',
  of: [
    {
      type: 'block',
      styles: [{title: 'Normal', value: 'normal'}],
      lists: [],
      marks: {
        decorators: [],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [{name: 'href', type: 'url', title: 'URL'}],
          },
        ],
      },
      // Inline objects: images that flow WITH the text, not between blocks.
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [{name: 'alt', type: 'string', title: 'Alt Text'}],
        },
      ],
    },
  ],
}
