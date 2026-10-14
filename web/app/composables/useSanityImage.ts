type SanityImage = { asset?: { _ref?: string } } | null | undefined
type UrlOptions = { w?: number; q?: number }

// An image field as the Studio stores it: the editor's crop (fractions cut
// from each edge) and hotspot (the point to keep in frame, as fractions).
type EditedImage = SanityImage & {
  crop?: { top: number; bottom: number; left: number; right: number }
  hotspot?: { x: number; y: number }
}

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

// Open Graph's recommended link-preview size.
const SHARE_WIDTH = 1200
const SHARE_HEIGHT = 630

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * Link-preview image URL: exactly 1200 × 630, cut from inside the editor's
 * crop and centered on their hotspot as far as the crop allows (the same
 * framing the Studio previews). JPEG, since auto=format could hand a crawler
 * a WebP or AVIF it won't read. '' for empty fields.
 *
 * Usage: const shareImageFor = useSanityShareImage()  →  shareImageFor(image)
 */
export const useSanityShareImage = () => {
  const { projectId, dataset } = useSanity().client.config()

  return (image: EditedImage) => {
    const ref = image?.asset?._ref
    if (!ref) return ''
    const [, id, size, format] = ref.split('-')
    const [width, height] = size!.split('x').map(Number) as [number, number]

    const crop = image!.crop ?? { top: 0, bottom: 0, left: 0, right: 0 }
    const cropLeft = crop.left * width
    const cropTop = crop.top * height
    const cropWidth = width * (1 - crop.left - crop.right)
    const cropHeight = height * (1 - crop.top - crop.bottom)

    // The largest share-shaped rectangle that fits the crop…
    const ratio = SHARE_WIDTH / SHARE_HEIGHT
    const rectWidth = Math.min(cropWidth, cropHeight * ratio)
    const rectHeight = rectWidth / ratio
    // …centered on the hotspot, kept inside the crop.
    const centerX = image!.hotspot ? image!.hotspot.x * width : cropLeft + cropWidth / 2
    const centerY = image!.hotspot ? image!.hotspot.y * height : cropTop + cropHeight / 2
    const rectLeft = clamp(centerX - rectWidth / 2, cropLeft, cropLeft + cropWidth - rectWidth)
    const rectTop = clamp(centerY - rectHeight / 2, cropTop, cropTop + cropHeight - rectHeight)

    const rect = [rectLeft, rectTop, rectWidth, rectHeight].map(Math.round).join(',')
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${size}.${format}?rect=${rect}&w=${SHARE_WIDTH}&h=${SHARE_HEIGHT}&fm=jpg&q=85`
  }
}
