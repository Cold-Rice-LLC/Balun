type SanityImage = { asset?: { _ref?: string } } | null | undefined
type UrlOptions = { w?: number; q?: number }

// Responsive candidates for srcset. Tops out near a retina laptop's full
// width (1728 css px × 2); fit=max never upscales past the asset itself.
const SRCSET_WIDTHS = [800, 1200, 1600, 2000, 2400, 3000, 3600]

/**
 * Sanity CDN image URL from an image field's asset ref, via the configured
 * project (no extra dep needed for basic resizing). Returns '' for empty
 * fields so callers can v-if on it. `q` overrides the CDN's default quality,
 * which is heavy enough to show grain on large product shots.
 *
 * Usage: const urlFor = useSanityImage()  →  urlFor(image, { w: 1600 })
 */
export const useSanityImage = () => {
  const { projectId, dataset } = useSanity().client.config()

  return (image: SanityImage, { w = 1200, q }: UrlOptions = {}) => {
    const ref = image?.asset?._ref
    if (!ref) return ''
    const [, id, size, format] = ref.split('-')
    const quality = q ? `&q=${q}` : ''
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${size}.${format}?w=${w}&fit=max&auto=format${quality}`
  }
}

/**
 * srcset for images drawn large (pair with a `sizes` that describes the
 * rendered width), so each screen downloads the width it actually draws —
 * a single fixed `w` either upscales on retina or overfetches on phones.
 *
 * Usage: const srcsetFor = useSanitySrcset()  →  srcsetFor(image, { q: 85 })
 */
export const useSanitySrcset = () => {
  const urlFor = useSanityImage()

  return (image: SanityImage, { q }: Pick<UrlOptions, 'q'> = {}) =>
    image?.asset?._ref ? SRCSET_WIDTHS.map((w) => `${urlFor(image, { w, q })} ${w}w`).join(', ') : ''
}
