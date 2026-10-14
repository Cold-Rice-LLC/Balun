/**
 * Product titles follow the colorway convention "Base · Color"
 * ("Speedy 01 · Grey"). Titles without the separator are a base name alone.
 */

/** "Speedy 01 · Grey" → "Speedy 01"; separator-less titles come back whole. */
export const baseName = (title = '') => (title.includes('·') ? title.split('·')[0]!.trim() : title)

/**
 * "Speedy 01 · Grey" → "Grey". Separator-less titles have no color half, so
 * they return `fallback` — the cart shows nothing there, the colorways rail
 * the full title.
 */
export const colorName = (title = '', fallback = '') =>
  title.includes('·') ? title.split('·').pop()!.trim() : fallback
