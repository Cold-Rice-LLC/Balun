/**
 * Sanity CDN image URL from an image field's asset ref, via the configured
 * project (no extra dep needed for basic resizing). Returns '' for empty
 * fields so callers can v-if on it.
 *
 * Usage: const urlFor = useSanityImage()  →  urlFor(image, { w: 1600 })
 */
export const useSanityImage = () => {
  const { projectId, dataset } = useSanity().client.config()

  return (image: { asset?: { _ref?: string } } | null | undefined, { w = 1200 } = {}) => {
    const ref = image?.asset?._ref
    if (!ref) return ''
    const [, id, size, format] = ref.split('-')
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${size}.${format}?w=${w}&fit=max&auto=format`
  }
}
