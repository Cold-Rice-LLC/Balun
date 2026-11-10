// Matches vimeo.com/{id}, vimeo.com/{id}/{hash}, player.vimeo.com/video/{id}
// and channel/group/showcase paths — the same pattern the studio validates
// against (studio/schemaTypes/lib/vimeo.js); group 1 is the ID.
const VIMEO_ID_PATTERN =
  /vimeo\.com\/(?:video\/|(?:channels|groups|showcase)\/[^/]+\/(?:video\/)?)?(\d+)/

// The player.vimeo.com embed URL for a Vimeo link of any shape, or null if it
// isn't one. Unlisted videos only play with their private hash, which the
// share link carries as a path segment (vimeo.com/{id}/{hash}) and the embed
// link as ?h=; either way it rides along.
export const vimeoEmbedUrl = (url?: string | null) => {
  const id = url?.match(VIMEO_ID_PATTERN)?.[1]
  if (!id) return null
  const hash = url!.match(new RegExp(`${id}/([\\da-f]+)`))?.[1] ?? url!.match(/[?&]h=([\da-f]+)/)?.[1]
  const params = new URLSearchParams({ autoplay: '1', playsinline: '1', dnt: '1' })
  if (hash) params.set('h', hash)
  return `https://player.vimeo.com/video/${id}?${params}`
}
