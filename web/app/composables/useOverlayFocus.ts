import type { Ref } from 'vue'

type Getter = () => HTMLElement | null | undefined

// Open trapping overlays, innermost last: the cart opening over quick add (or
// the buy panel) takes the trap while it's open and hands it back on close.
const traps: {
  root: HTMLElement
  include?: () => (HTMLElement | null | undefined)[]
}[] = []

const onTrapKeydown = (e: KeyboardEvent) => {
  const trap = traps.at(-1)
  if (e.key !== 'Tab' || !trap) return
  const els = tabbables(trap.root, trap.include?.())
  e.preventDefault()
  if (!els.length) return trap.root.focus({ preventScroll: true })
  const i = els.indexOf(document.activeElement as HTMLElement)
  const next = i === -1 ? (e.shiftKey ? els.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + els.length) % els.length
  els[next]!.focus()
}

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
 * `trap` keeps Tab inside the overlay while it's open: Tab and Shift+Tab
 * cycle through its focusable elements (plus any `include` returns — a
 * control outside the root that belongs to the overlay, like the nav's
 * checkout button for the cart), wrapping at either end. The innermost open
 * overlay holds the trap. Escape and the overlay's own close are the way out.
 *
 * `root` is read on open, not on close: a v-if panel's ref is already null by
 * then while its element lingers through the leave transition — and that
 * lingering element is exactly where focus still is.
 */
export const useOverlayFocus = (
  isOpen: Ref<boolean>,
  {
    root,
    initial,
    returnTo,
    fallback,
    trap = false,
    include,
  }: {
    root: Getter
    initial: Getter
    returnTo?: Getter
    fallback?: Getter
    trap?: boolean
    include?: () => (HTMLElement | null | undefined)[]
  },
) => {
  let opener: HTMLElement | null = null
  let rootEl: HTMLElement | null = null
  let entry: (typeof traps)[number] | null = null

  const release = () => {
    if (!entry) return
    traps.splice(traps.indexOf(entry), 1)
    entry = null
    if (!traps.length) document.removeEventListener('keydown', onTrapKeydown)
  }
  onScopeDispose(release)

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
      if (trap && rootEl && isOpen.value && !entry) {
        entry = { root: rootEl, include }
        if (!traps.length) document.addEventListener('keydown', onTrapKeydown)
        traps.push(entry)
      }
      return
    }
    release()
    await nextTick()
    const active = document.activeElement
    const inside = active === document.body || (active instanceof Node && !!rootEl?.contains(active))
    if (!inside) return
    const target = returnTo ? returnTo() : canFocus(opener) ? opener : fallback?.()
    if (canFocus(target)) target.focus({ preventScroll: true })
  })
}
