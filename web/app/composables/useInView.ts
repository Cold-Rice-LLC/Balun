import type { Ref } from 'vue'

/**
 * Whether an element is currently in the viewport, as a reactive ref.
 *
 * Drives visibility-coupled UI: the featured-product module's fixed CTAs
 * fade in while the module is on screen, and the feed's endless scroll
 * watches a sentinel near the list's end.
 *
 * `target` is a template ref to a plain element (for a component, pass a
 * ref to one of its elements — component instances aren't observable).
 * Starts false and stays false on the server; the observer connects on
 * mount and follows the ref if the element swaps (v-if remounts).
 */
export const useInView = (
  target: Ref<Element | null | undefined>,
  options: IntersectionObserverInit = { threshold: 0.2 },
) => {
  const inView = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    observer = new IntersectionObserver(([entry]) => {
      inView.value = entry?.isIntersecting ?? false
    }, options)

    watch(
      target,
      (el) => {
        observer?.disconnect()
        inView.value = false
        if (el) observer?.observe(el)
      },
      { immediate: true },
    )
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return inView
}
