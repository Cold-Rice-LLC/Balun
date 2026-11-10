/**
 * Vimeo URL handling for the video module's long-form embed.
 */

// Matches vimeo.com/{id}, vimeo.com/{id}/{hash} (unlisted), player.vimeo.com/video/{id}
// and channel/group/showcase paths ending in the ID; group 1 is the ID.
export const VIMEO_ID_PATTERN =
  /vimeo\.com\/(?:video\/|(?:channels|groups|showcase)\/[^/]+\/(?:video\/)?)?(\d+)/

// Same contract as youtubeUrlRule: required and parseable only while
// `appliesTo` says the field is in play.
export const vimeoUrlRule = (appliesTo) => (Rule) =>
  Rule.custom((value, context) => {
    if (!appliesTo(context)) return true
    if (!value) return 'Vimeo URL is required.'
    return VIMEO_ID_PATTERN.test(value) ? true : 'Not a recognizable Vimeo video URL.'
  })
