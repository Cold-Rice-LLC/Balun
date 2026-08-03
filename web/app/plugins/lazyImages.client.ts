/**
 * Completes the lazy-image fade-in contract from global.css: every
 * img[loading="lazy"] starts at opacity 0 and fades in once it carries the
 * `loaded` class — this plugin is what adds that class. Without it, lazy
 * images (product grid, feed covers, colorway thumbs) stay invisible.
 *
 * Two paths cover every timing:
 * - a capture-phase load listener (load doesn't bubble, but it captures)
 *   marks images that finish after the app starts
 * - a sweep on mount and after each navigation marks images that were
 *   already complete before the listener attached (SSR markup + cache hits)
 *
 * Broken images stay unmarked (naturalWidth 0) — hidden beats a broken
 * image icon.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const mark = (img: HTMLImageElement) => img.classList.add('loaded')

  document.addEventListener(
    'load',
    (event) => {
      const target = event.target
      if (target instanceof HTMLImageElement && target.loading === 'lazy') mark(target)
    },
    true,
  )

  const sweep = () => {
    for (const img of document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) {
      if (img.complete && img.naturalWidth > 0) mark(img)
    }
  }
  nuxtApp.hook('app:mounted', sweep)
  nuxtApp.hook('page:finish', sweep)
})
