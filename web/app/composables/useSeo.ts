type SeoImage = { asset?: { _ref?: string } } | null | undefined

// A page's `seo` overrides from the Studio (seoProjection in queries.ts).
interface SeoOverrides {
  title?: string | null
  description?: string | null
  image?: SeoImage
}

interface PageSeo {
  // The Studio's overrides; each field that's set wins over the page's own.
  seo?: SeoOverrides | null
  // The page's own title; "— {Site Title}" follows it. None (the home page)
  // means the site title alone.
  title?: string | null
  description?: string | null
  image?: SeoImage
  // Keep the page out of search engines (error pages).
  noindex?: boolean
}

// Search results cut descriptions off at about this length.
const DESCRIPTION_LENGTH = 160

// Collapsed to one line, and cut at a word with an ellipsis past the limit.
const trimDescription = (text: string) => {
  const line = text.replace(/\s+/g, ' ').trim()
  if (line.length <= DESCRIPTION_LENGTH) return line
  return `${line.slice(0, DESCRIPTION_LENGTH).replace(/\s+\S*$/, '')}…`
}

/**
 * The head tags for search engines and shared links: a page's Studio SEO
 * overrides first, then its own content (`title` / `description` / `image`),
 * then Site Settings (site title, meta description, share image). Titles
 * read "Page — Balun"; share images are cropped to 1200 × 630.
 *
 * Canonical, og:url, og:locale and hreflang come from useLocaleHead once
 * the production domain is set — docs/launch-checklist.md step 1.
 *
 * Usage: useSeo(() => ({ seo: doc.value?.seo, title: doc.value?.title }))
 */
export const useSeo = (page: () => PageSeo = () => ({})) => {
  const { data: settings } = useSiteSettings()
  const shareImageFor = useSanityShareImage()

  const siteTitle = computed(() => settings.value?.siteTitle || 'Balun')

  const title = computed(() => {
    const own = page().seo?.title || page().title
    return own ? `${own} — ${siteTitle.value}` : siteTitle.value
  })

  const description = computed(
    () =>
      trimDescription(page().seo?.description || page().description || settings.value?.metaDescription || '') ||
      undefined,
  )

  const imageUrl = computed(() => {
    const { seo, image } = page()
    const chosen = [seo?.image, image, settings.value?.ogImage].find((candidate) => candidate?.asset)
    return shareImageFor(chosen) || undefined
  })

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogSiteName: siteTitle,
    ogType: 'website',
    ogImage: imageUrl,
    ogImageWidth: () => (imageUrl.value ? 1200 : undefined),
    ogImageHeight: () => (imageUrl.value ? 630 : undefined),
    twitterCard: () => (imageUrl.value ? 'summary_large_image' : 'summary'),
    robots: () => (page().noindex ? 'noindex' : undefined),
  })
}
