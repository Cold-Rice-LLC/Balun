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

  // Load a persisted cart (balunCartId in localStorage) on first mount.
  const init = async () => {
    if (!cart.value) await shopify.FetchCart(null, true, language())
  }

  const addItem = async (variantId: string, quantity = 1) => {
    const result = await shopify.AddToCart(variantId, quantity, market.value.country, language())
    if (result) open()
    return result
  }

  const updateLine = (lineId: string, quantity: number) => {
    if (quantity < 1) return removeLine(lineId)
    return shopify.UpdateLineItems(cart.value?.id, [{ id: lineId, quantity }], language())
  }

  const removeLine = (lineId: string) =>
    shopify.RemoveLineItems(cart.value?.id, [lineId], language())

  // Hand off to Shopify's hosted checkout. buyerIdentity set at creation means
  // it opens in the right market/currency.
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
