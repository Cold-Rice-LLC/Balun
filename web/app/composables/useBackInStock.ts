/**
 * Back-in-stock popup state: which sold-out product the popup is asking
 * about. Opened from the PDP's "notify me" button and the grid cards'
 * "Notify" pill; BackInStockModal (mounted once in the layout) renders it.
 * Only the handle and title are needed: /api/back-in-stock looks up the
 * product's sizes itself (docs/back-in-stock.md).
 */
interface BackInStockProduct {
  handle: string
  title: string
}

export const useBackInStock = () => {
  const product = useState<BackInStockProduct | null>('back-in-stock-product', () => null)
  const isOpen = computed(() => product.value !== null)

  const open = ({ handle, title }: BackInStockProduct) => {
    product.value = { handle, title }
  }

  const close = () => {
    product.value = null
  }

  return { product, isOpen, open, close }
}
