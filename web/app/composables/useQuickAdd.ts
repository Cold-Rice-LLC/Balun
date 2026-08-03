/**
 * Quick-add state: which product the home-page quick-add drawer is showing.
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
  // Show the drawer's "learn more" link to the product's PDP. Default true;
  // pass false where the link is pointless (the PDP opening quick add for
  // the product already on screen).
  learnMore?: boolean
  // Dim/blur the page behind the drawer and lock scroll. Default true; pass
  // false where the page should stay usable alongside the drawer (the PDP,
  // whose own buy button and colorway rail must stay visible and clickable).
  backdrop?: boolean
}

export const useQuickAdd = () => {
  const active = useState<QuickAddPayload | null>('quick-add-product', () => null)
  const isOpen = computed(() => active.value !== null)

  const { close: closeCart } = useCart()

  const open = (payload: QuickAddPayload) => {
    active.value = payload
    closeCart()
  }

  const close = () => {
    active.value = null
  }

  return {
    active,
    isOpen,
    open,
    close,
  }
}
