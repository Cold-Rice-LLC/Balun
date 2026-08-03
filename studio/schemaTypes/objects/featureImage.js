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
              description:
                'The exact spot on the image the line points at: 0 = left edge, 100 = right edge. The anchor is fixed — Text Side never changes what this means.',
              validation: (Rule) => Rule.required().min(0).max(100),
            },
            {
              name: 'yPosition',
              type: 'number',
              title: 'Anchor Y (%)',
              description:
                'The exact spot on the image the line points at: 0 = top edge, 100 = bottom edge. The line and text are vertically centered on this.',
              validation: (Rule) => Rule.required().min(0).max(100),
            },
            {
              name: 'textPosition',
              type: 'number',
              title: 'Text X (%)',
              description:
                'Optional. Where the TEXT end of the line sits — same 0–100 scale across the image as Anchor X. Leave blank to sit at the image edge; set it to pull the text and its line in toward the middle.',
              validation: (Rule) =>
                Rule.min(0)
                  .max(100)
                  .custom((value, context) => {
                    if (value == null) return true
                    const {xPosition, side} = context.parent || {}
                    if (xPosition == null) return true
                    if (side === 'right' && value <= xPosition)
                      return 'With Text Side "Right", this must be greater than Anchor X.'
                    if (side !== 'right' && value >= xPosition)
                      return 'With Text Side "Left", this must be less than Anchor X.'
                    return true
                  }),
            },
            {
              name: 'side',
              type: 'string',
              title: 'Text Side',
              description:
                'Where the text sits, not where the line points. Left: text at the left image edge, line runs right to the anchor. Right: text at the right image edge, line runs left to the anchor.',
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
              title: 'Max Width (% of image)',
              description:
                'Optional. Wraps the text once it reaches this share of the image width (50 = half the image), so it scales with the image rather than the window. Leave blank to keep the text on one line, breaking only where you break it.',
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
