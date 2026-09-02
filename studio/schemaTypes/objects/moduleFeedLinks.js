import {LinkIcon} from '@sanity/icons'

/**
 * Feed detail module: a row of button-style links (e.g. RSVP, tickets, a
 * product). Labels translate; targets are internal paths or external URLs.
 */
export default {
  name: 'moduleFeedLinks',
  type: 'object',
  title: 'Links',
  icon: LinkIcon,
  fields: [
    {
      name: 'links',
      type: 'array',
      title: 'Links',
      description: 'Rendered as a row of buttons, in this order.',
      of: [{type: 'labeledLink'}],
      validation: (Rule) => Rule.min(1).error('Add at least one link.'),
    },
  ],
  preview: {
    select: {links: 'links'},
    prepare({links}) {
      const count = links?.length ?? 0
      return {title: `Links · ${count} link${count === 1 ? '' : 's'}`, subtitle: 'Links module'}
    },
  },
}
