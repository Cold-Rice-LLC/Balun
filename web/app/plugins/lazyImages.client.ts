/**
 * Completes the lazy-image fade-in contract from global.css: every
 * img[loading="lazy"] starts at opacity 0 and fades in once it carries the
 * `loaded` class — this plugin is what adds that class. Without it, lazy
 * images (product grid, feed covers, colorway thumbs) stay invisible.
 *
 * Two paths cover every timing:
 * - a capture-phase load listener (load doesn't bubble, but it captures)
 *   marks images that finish after the app starts
 * - a sweep once hydration resolves and after each navigation marks images
 *   that were already complete before then (SSR markup + cache hits)
 *
 * Broken images stay unmarked (naturalWidth 0) — hidden beats a broken
 * image icon.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const mark = (img: HTMLImageElement) => img.classList.add('loaded')

  // Hydration diffs the class attribute, so marking mid-hydration (a cache
  // hit firing `load` between plugin setup and suspense resolve) trips a
  // "class mismatch" warning. Hold marks until hydration is done — anything
  // that loaded in the meantime is `complete` and the resolve sweep catches
  // it.
  let hydrated = false

  document.addEventListener(
    'load',
    (event) => {
      const target = event.target
      if (hydrated && target instanceof HTMLImageElement && target.loading === 'lazy') mark(target)
    },
    true,
  )

  const sweep = () => {
    for (const img of document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) {
      if (img.complete && img.naturalWidth > 0) mark(img)
    }
  }
  nuxtApp.hook('app:suspense:resolve', () => {
    hydrated = true
    sweep()
  })
  nuxtApp.hook('page:finish', sweep)
})
