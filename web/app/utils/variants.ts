/**
 * Resolve which variant a surface should treat as selected: the explicit
 * pick when it's still in the list, else the first purchasable size, else
 * the first variant (all sold out — the button shows sold out).
 *
 * Shared by ProductOptionsPanel and any surface that needs to show data for
 * the same selection (e.g. the quick-add drawer's header price).
 */
interface VariantLike {
  id: string
  availableForSale?: boolean
}

export const pickVariant = <T extends VariantLike>(variants: T[], selectedId: string | null): T | null =>
  variants.find((v) => v.id === selectedId) ??
  variants.find((v) => v.availableForSale) ??
  variants[0] ??
  null
