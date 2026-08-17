/**
 * Quick-add state: which product the quick-add drawer is showing (opened
 * from product cards; the PDP has its own integrated buy panel).
 *
 * Mirrors the cart's pattern — a shared useState so the card triggers, the
 * drawer, and the nav all see the same selection. `active` holds the pair the
 * cards already have ({ doc: Sanity editorial, live: Storefront product });
 * the drawer fetches full variants itself via useShopifyProduct, since the
 * home page's batch read is deliberately variant-free (see /api/products).
 *
 * Opening quick-add closes the cart drawer so the two panels never stack;
 * the reverse (cart opening closes quick-add) lives in QuickAddDrawer.
 */

interface QuickAddPayload {
  doc: Record<string, unknown> | null
  live: Record<string, any>
}

export const useQuickAdd = () => {
  const active = useState<QuickAddPayload | null>('quick-add-product', () => null)
  const isOpen = computed(() => active.value !== null)

  // True while the drawer is holding its reveal for the variants fetch (a
  // cold open — see QuickAddDrawer); triggers read it to show a progress
  // cursor on the button that was just clicked.
  const pendingOpen = useState<boolean>('quick-add-pending-open', () => false)

  const { close: closeCart } = useCart()

  const open = (payload: QuickAddPayload) => {
    active.value = payload
    closeCart()
  }

  const close = () => {
    active.value = null
    // A close mid-fetch (route change, cart opening) also ends the wait the
    // triggers are showing a cursor for.
    pendingOpen.value = false
  }

  return {
    active,
    isOpen,
    pendingOpen,
    open,
    close,
  }
}
