/**
 * UI-facing cart API: the open/closed drawer state plus derived cart values,
 * built on top of useShopifyClient (which owns the Storefront cart mutations).
 *
 * Cart data lives in a shared useState via useShopifyClient; open state is its
 * own shared useState so any component (nav button, buy box, drawer) sees the
 * same cart. Country for buyerIdentity comes from the URL market (useMarket).
 */
export const useCart = () => {
  const shopify = useShopifyClient()
  const market = useMarket()
  const isOpen = useState('cart-open', () => false)

  // Shopify LanguageCode for @inContext on every cart op, so line titles and
  // the hosted checkout follow the URL's language.
  const language = () => market.value.lang.toUpperCase()

  const cart = shopify.Cart
  const lines = computed(() => cart.value?.lines?.nodes ?? [])
  const lineCount = computed(() => lines.value.reduce((total, line) => total + line.quantity, 0))
  const subtotal = computed(() => cart.value?.cost?.subtotalAmount ?? null)
  const checkoutUrl = computed(() => cart.value?.checkoutUrl ?? null)

  const open = () => {
    isOpen.value = true
  }
  const close = () => {
    isOpen.value = false
  }

  // A cart's currency is pinned to its buyerIdentity, not the URL — left
  // alone, a cart created on /en-us stays USD after switching to /en-gb.
  // cartBuyerIdentityUpdate re-points it: Shopify reprices every line, the
  // subtotal, and checkoutUrl in the new market's currency.
  const syncMarket = async () => {
    if (!cart.value?.id) return
    if (cart.value.buyerIdentity?.countryCode === market.value.country) return
    await shopify.UpdateBuyerIdentity(cart.value.id, market.value.country, language())
  }

  // One watcher app-wide: useCart is called from many components, and each
  // call registering its own watcher would fire duplicate mutations per
  // switch. The first client-side caller is the persistent layout nav, so
  // the watcher lives for the whole session.
  if (import.meta.client) {
    const registered = useState('cart-market-watch', () => false)
    if (!registered.value) {
      registered.value = true
      watch(() => market.value.country, () => syncMarket())
    }
  }

  // Load a persisted cart (balunCartId in localStorage) on first mount, and
  // re-point it if it came back from a session in another market.
  const init = async () => {
    if (!cart.value) await shopify.FetchCart(null, true, language())
    await syncMarket()
  }

  // `openCart: false` lets in-place flows (quick-add's "added!" state) confirm
  // without yanking the drawer open over them.
  const addItem = async (variantId: string, quantity = 1, { openCart = true } = {}) => {
    const result = await shopify.AddToCart(variantId, quantity, market.value.country, language())
    if (result && openCart) open()
    return result
  }

  const updateLine = (lineId: string, quantity: number) => {
    if (quantity < 1) return removeLine(lineId)
    return shopify.UpdateLineItems(cart.value?.id, [{ id: lineId, quantity }], language())
  }

  const removeLine = (lineId: string) =>
    shopify.RemoveLineItems(cart.value?.id, [lineId], language())

  // Hand off to Shopify's hosted checkout. buyerIdentity (set at creation,
  // re-synced on market switch) means it opens in the right market/currency.
  const checkout = () => {
    if (checkoutUrl.value) window.location.href = checkoutUrl.value
  }

  return {
    isOpen,
    cart,
    lines,
    lineCount,
    subtotal,
    checkoutUrl,
    open,
    close,
    init,
    addItem,
    updateLine,
    removeLine,
    checkout,
  }
}
