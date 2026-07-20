import type { Ref } from 'vue'

/**
 * Locks page scroll while the given overlay-open ref is true.
 *
 * Counted rather than a plain on/off: overlays can overlap mid-transition
 * (opening the cart closes the quick add; the two locale modals are separate
 * instances), and a naive clear from the closing one would unlock the page
 * out from under the one still open. The html/body overflow override clears
 * only when the last open overlay closes.
 *
 * Each instance tracks whether IT is currently counted, so mount/unmount and
 * open/close can interleave in any order without drifting the counter — in
 * dev, HMR remounts a component mid-open (unmount −1, remount, still open),
 * and without the immediate re-sync the lock would be lost and the counter
 * would go negative on the next close.
 *
 * Call once per overlay component with its open state.
 */
export const useScrollLock = (isOpen: Ref<boolean>) => {
  const count = useState('scroll-lock-count', () => 0)

  const apply = () => {
    if (import.meta.server) return
    const overflow = count.value > 0 ? 'hidden' : ''
    // Both elements: html is the scrolling element here, but Safari has
    // historically keyed page scroll off body — cover both.
    document.documentElement.style.overflow = overflow
    document.body.style.overflow = overflow
  }

  // Whether this instance is currently represented in the counter.
  let counted = false
  const sync = (open: boolean) => {
    if (open === counted) return
    counted = open
    count.value = Math.max(0, count.value + (open ? 1 : -1))
    apply()
  }

  // immediate: an instance mounted with its overlay already open (HMR
  // remount) must claim its count right away, not on the next toggle.
  watch(isOpen, sync, { immediate: true })

  onBeforeUnmount(() => sync(false))
}
