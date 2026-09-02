import {linkTargetFields} from './linkTarget'

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
            // The same destination shape as navLink / linkTarget: pick a
            // document on this site, or type an external URL. Internal
            // links hold a reference rather than a typed path, so they
            // survive a slug change and can't be spelled wrong.
            fields: linkTargetFields({required: true, schemes: ['http', 'https', 'mailto', 'tel']}),
          },
        ],
      },
    },
    {type: 'image', options: {hotspot: true}},
  ],
}
