/**
 * Where a link points, with no label of its own — the destination half of
 * navLink / labeledLink, and the whole thing wherever the clickable content
 * is something else (the marquee's text, the headline-over-image caption).
 * Internal links reference the document, so a route change is a change in
 * the site's internalLinkPath, not a content migration. Pass
 * `required: true` for links that must point somewhere; left optional, an
 * untouched (or None) link renders as no link.
 */
export const linkTargetFields = ({required = false, schemes} = {}) => [
  {
    name: 'linkType',
    type: 'string',
    title: 'Link Type',
    description: required
      ? 'Internal for a page on this site (opens in place); External for another website (opens in a new tab).'
      : 'None for no link; Internal for a page on this site (opens in place); External for another website (opens in a new tab).',
    options: {
      list: [
        // A radio can't be un-picked, so an optional link needs an explicit
        // way back to no link once Internal or External has been clicked.
        // Required links must point somewhere, so they don't get the out.
        ...(required ? [] : [{title: 'None', value: 'none'}]),
        {title: 'Internal', value: 'internal'},
        {title: 'External', value: 'external'},
      ],
      layout: 'radio',
    },
    initialValue: required ? 'internal' : undefined,
    validation: (Rule) => (required ? Rule.required() : Rule),
  },
  {
    name: 'internalLink',
    type: 'reference',
    title: 'Page',
    description:
      "The page, post or product on this site the link goes to. Any market's version of a page goes to the same place.",
    to: [
      {type: 'homePage'},
      {type: 'infoPage'},
      {type: 'livePage'},
      {type: 'feedPage'},
      {type: 'legalPage'},
      {type: 'feedPost'},
      {type: 'product'},
    ],
    options: {disableNew: true},
    hidden: ({parent}) => parent?.linkType !== 'internal',
    validation: (Rule) =>
      Rule.custom((value, context) =>
        context.parent?.linkType === 'internal' && !value ? 'Choose a page.' : true,
      ),
  },
  {
    name: 'externalUrl',
    type: 'url',
    title: 'External URL',
    description: schemes
      ? 'A full URL including https://, or a mailto:/tel: address. Opens in a new tab.'
      : 'A full URL, including https://. Opens in a new tab.',
    hidden: ({parent}) => parent?.linkType !== 'external',
    // `url` allows http/https only unless told otherwise — rich text links
    // also reach inboxes and phone numbers.
    validation: (Rule) =>
      (schemes ? Rule.uri({scheme: schemes}) : Rule).custom((value, context) =>
        context.parent?.linkType === 'external' && !value ? 'External URL is required.' : true,
      ),
  },
]

// Singletons have no title of their own; the type names them in previews.
const TYPE_TITLES = {
  homePage: 'Home',
  infoPage: 'Info',
  livePage: 'Live',
  feedPage: 'Feed',
}

/**
 * Shared preview select for a link destination, reaching through the
 * reference for the target's name — which lives in a different place per
 * type (plain title, translated title, Shopify store title, or none at all).
 * `prefix` addresses a nested link object (e.g. 'link.').
 */
export const linkTargetSelect = (prefix = '') => ({
  linkType: `${prefix}linkType`,
  internalType: `${prefix}internalLink._type`,
  internalTitle: `${prefix}internalLink.title.0.value`,
  internalStoreTitle: `${prefix}internalLink.store.title`,
  internalMarket: `${prefix}internalLink.market`,
  externalUrl: `${prefix}externalUrl`,
})

/** Shared preview subtitle for a link destination. */
export const linkTargetSubtitle = ({
  linkType,
  internalType,
  internalTitle,
  internalStoreTitle,
  internalMarket,
  externalUrl,
}) => {
  if (linkType === 'external') return `↗ ${externalUrl || ''}`
  if (linkType !== 'internal' || !internalType) return ''
  const name = internalTitle || internalStoreTitle || TYPE_TITLES[internalType] || internalType
  return internalMarket ? `${name} — ${internalMarket.toUpperCase()}` : name
}

/** Reusable label-less, optional link. */
export default {
  name: 'linkTarget',
  type: 'object',
  title: 'Link',
  fields: linkTargetFields(),
  preview: {
    select: linkTargetSelect(),
    prepare: (link) => ({title: linkTargetSubtitle(link) || 'No link'}),
  },
}
