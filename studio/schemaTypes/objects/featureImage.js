import {requireEnglish} from '../lib/i18nValidation'

/**
 * A feature-carousel slide: an image with positioned text callouts
 * ("highlights"). Lives on the product document (product.featureCarousel) so
 * the same slides render in the home Featured Product module and on the PDP.
 *
 * Highlight coordinates are % of the image frame — the front end locks the
 * frame to the asset's intrinsic aspect ratio, so the anchor point can't
 * drift at any viewport size. The leader line runs from the text block to
 * the anchor; `side` picks which side of the anchor the text sits on.
 */
export default {
  name: 'featureImage',
  type: 'image',
  title: 'Feature Image',
  options: {hotspot: true},
  fields: [
    {
      name: 'alt',
      type: 'string',
      title: 'Alt Text',
    },
    {
      name: 'highlights',
      type: 'array',
      title: 'Highlights',
      description: 'Text callouts pointing at parts of the image.',
      of: [
        {
          type: 'object',
          name: 'highlight',
          title: 'Highlight',
          fields: [
            {
              name: 'text',
              type: 'internationalizedArrayText',
              title: 'Text',
              description: 'Line breaks are kept (stack short lines).',
              validation: requireEnglish,
            },
            {
              name: 'xPosition',
              type: 'number',
              title: 'Anchor X (%)',
              description: 'Where the line points: 0 = left edge of the image, 100 = right edge.',
              validation: (Rule) => Rule.required().min(0).max(100),
            },
            {
              name: 'yPosition',
              type: 'number',
              title: 'Anchor Y (%)',
              description: 'Where the line points: 0 = top edge of the image, 100 = bottom edge.',
              validation: (Rule) => Rule.required().min(0).max(100),
            },
            {
              name: 'side',
              type: 'string',
              title: 'Text Side',
              description: 'Which side of the anchor the text sits on; the line runs from the text to the anchor.',
              options: {
                list: [
                  {title: 'Left', value: 'left'},
                  {title: 'Right', value: 'right'},
                ],
                layout: 'radio',
              },
              initialValue: 'left',
            },
            {
              name: 'width',
              type: 'number',
              title: 'Width (vw)',
              description: 'Optional max width of the text block, in vw.',
              validation: (Rule) => Rule.min(0).max(100),
            },
          ],
          preview: {
            select: {text: 'text.0.value', x: 'xPosition', y: 'yPosition'},
            prepare({text, x, y}) {
              return {
                title: text || 'Highlight',
                subtitle: `${x ?? '?'}% / ${y ?? '?'}%`,
              }
            },
          },
        },
      ],
    },
  ],
}
