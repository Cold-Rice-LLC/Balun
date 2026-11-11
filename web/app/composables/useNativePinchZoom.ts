import type { Ref } from 'vue'
import type { Swiper as SwiperInstance } from 'swiper'

// Hands pinch back to the browser on a horizontal Swiper. Swiper's stylesheet
// sets `touch-action: pan-y` on it, which leaves every other gesture — pinch
// included — to Swiper, so the page's own pinch-zoom never starts over one.
// The carousel adds `pinch-zoom` back in its CSS; this keeps the two from
// fighting:
// - a second finger pauses Swiper's drag, so a pinch doesn't also slide
//   (Swiper only follows the first finger, and snaps back on release);
// - while the page is zoomed in, one finger pans the page instead of the
//   slides (`pageZoomed` is for the CSS to allow pan-x again). The arrows and
//   dots still change slide.
export const useNativePinchZoom = (swiper: Ref<SwiperInstance | null>) => {
  const pageZoomed = ref(false)
  let pinching = false

  const sync = () => {
    if (swiper.value) swiper.value.allowTouchMove = !pinching && !pageZoomed.value
  }

  useEventListener(
    () => (import.meta.client ? window.visualViewport : null),
    'resize',
    () => {
      pageZoomed.value = (window.visualViewport?.scale ?? 1) > 1.01
      sync()
    },
    { passive: true },
  )

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length > 1) {
      pinching = true
      sync()
    }
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (event.touches.length === 0) {
      pinching = false
      sync()
    }
  }

  watch(swiper, sync)

  return { pageZoomed, onTouchStart, onTouchEnd }
}
