/**
 * Reusable Portable Text field. Shared by product.body, feedPost.body, infoPage.body
 * so rich-text configuration lives in one place.
 */
export default {
  name: 'blockContent',
  type: 'array',
  title: 'Content',
  of: [
    {
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading', value: 'h2'},
        {title: 'Subheading', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {
                name: 'href',
                type: 'url',
                title: 'URL',
                description: 'Full web address, including https://.',
              },
            ],
          },
        ],
      },
    },
    {type: 'image', options: {hotspot: true}},
  ],
}
