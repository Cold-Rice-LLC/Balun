import { formatMoney } from '~/utils/money'

// formatMoney bound to the active locale, so currency formatting follows the
// URL's language ("$1,234.50" vs "1.234,50 $") rather than a fixed English.
export const useMoney = () => {
  const { locale } = useI18n()
  return (money: Parameters<typeof formatMoney>[0]) => formatMoney(money, locale.value)
}
