import type { Ref } from 'vue'

type Getter = () => HTMLElement | null | undefined

/**
 * Keyboard focus for an overlay or in-place panel. On open it remembers the
 * element that had focus and moves focus to `initial` once the overlay can
 * take it (after nextTick, so a lifted `inert` or a v-if has rendered). On
 * close — by any path: close button, backdrop, Escape, navigation — it hands
 * focus back to that opener, or to `fallback` when the opener is gone
 * (unmounted, inert, off the page).
 *
 * Focus is restored only when it was still inside the overlay (`root`), or
 * was dumped on <body> by the overlay going inert or unmounting. When
 * another overlay has already taken it — the cart opening over quick add,
 * or over the PDP's buy panel — it stays there; and when the close came
 * from a control outside the overlay (the nav's cart toggle), that control
 * keeps it.
 *
 * `returnTo` names the close target outright, for a trigger that unmounts
 * as the panel opens and remounts as it closes (the buy panel's purchase
 * button): the remembered opener is then a stale element, still in the DOM
 * mid-leave but about to go.
 *
 * `root` is read on open, not on close: a v-if panel's ref is already null by
 * then while its element lingers through the leave transition — and that
 * lingering element is exactly where focus still is.
 */
export const useOverlayFocus = (
  isOpen: Ref<boolean>,
  { root, initial, returnTo, fallback }: { root: Getter; initial: Getter; returnTo?: Getter; fallback?: Getter },
) => {
  let opener: HTMLElement | null = null
  let rootEl: HTMLElement | null = null

  const canFocus = (el: HTMLElement | null | undefined): el is HTMLElement =>
    !!el && el.isConnected && !el.closest('[inert]')

  watch(isOpen, async (open) => {
    if (open) {
      // <body> is never an opener: an add button disables itself while the
      // add is in flight, dropping focus to body before the cart opens.
      const active = document.activeElement
      opener = active instanceof HTMLElement && active !== document.body ? active : null
      await nextTick()
      rootEl = root() ?? null
      initial()?.focus({ preventScroll: true })
      return
    }
    await nextTick()
    const active = document.activeElement
    const inside = active === document.body || (active instanceof Node && !!rootEl?.contains(active))
    if (!inside) return
    const target = returnTo ? returnTo() : canFocus(opener) ? opener : fallback?.()
    if (canFocus(target)) target.focus({ preventScroll: true })
  })
}
