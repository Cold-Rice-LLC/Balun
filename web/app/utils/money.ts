/** Format a Storefront MoneyV2 ({ amount, currencyCode }) for display. */
export const formatMoney = (
  money: { amount: string | number; currencyCode: string } | null | undefined,
  locale = 'en-US',
) => {
  if (!money) return null
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currencyCode,
  }).format(Number(money.amount))
}
