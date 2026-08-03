/**
 * A product's still image, editorial first: the Sanity `featuredImage` when an
 * editor has art-directed one, else Shopify's own product image. Returns null
 * when neither exists so callers can v-if on it.
 *
 * Shared by the grid card and the PDP colorway rail so both surfaces resolve
 * the same field the same way — the two differ only in the width they ask for.
 *
 * Usage: const productImage = useProductImage()
 *        productImage(doc, live, { w: 900 })
 */
interface SanityImageField {
  asset?: { _ref?: string }
  alt?: string
}

interface ProductDoc {
  title?: string
  featuredImage?: SanityImageField | null
}

interface LiveProduct {
  title?: string
  featuredImage?: { url: string; altText?: string | null } | null
}

export const useProductImage = () => {
  const urlFor = useSanityImage()

  return (
    doc: ProductDoc | null | undefined,
    live: LiveProduct | null | undefined,
    { w = 900 } = {},
  ): { src: string; alt: string } | null => {
    const alt = live?.title || doc?.title || ''

    const editorial = doc?.featuredImage
    if (editorial?.asset) {
      return { src: urlFor(editorial, { w }), alt: editorial.alt || alt }
    }

    const shopify = live?.featuredImage
    return shopify ? { src: shopify.url, alt: shopify.altText || alt } : null
  }
}
