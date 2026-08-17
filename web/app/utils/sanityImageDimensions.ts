/**
 * Intrinsic { width, height } parsed from a Sanity image field's asset ref
 * (the id encodes them: image-<id>-<WxH>-<format>). Spread onto an <img> as
 * width/height attributes so the browser knows the aspect ratio and reserves
 * space before the file loads. Returns {} for empty/unparsable fields so the
 * attributes are simply omitted.
 */
export const sanityImageDimensions = (image: { asset?: { _ref?: string } } | null | undefined) => {
  const size = image?.asset?._ref?.split('-')[2]
  const [width, height] = size?.split('x').map(Number) ?? []
  return width && height ? { width, height } : {}
}
