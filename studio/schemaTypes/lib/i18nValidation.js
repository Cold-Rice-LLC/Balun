import {LANGUAGES, DEFAULT_LANGUAGE} from '../../../locales.mjs'

/**
 * Validation rules for internationalized-array fields (see the plugin README's
 * "Validation of individual array items").
 *
 * Every front-end query falls back to the default language
 * (coalesce(field[$lang], field.en)) — so a document without an English value
 * renders blank in every other language's fallback. These rules protect that
 * contract at publish time.
 */

const DEFAULT_TITLE =
  LANGUAGES.find((l) => l.id === DEFAULT_LANGUAGE)?.title ?? DEFAULT_LANGUAGE

// Non-empty for both field shapes: string values and blockContent arrays.
const hasValue = (item) =>
  item?.value != null && item.value !== '' && !(Array.isArray(item.value) && item.value.length === 0)

const defaultLanguageItem = (value) =>
  (value ?? []).find((item) => item.language === DEFAULT_LANGUAGE)

// Required field: must include a non-empty default-language value.
export const requireEnglish = (Rule) =>
  Rule.custom((value) =>
    hasValue(defaultLanguageItem(value))
      ? true
      : `${DEFAULT_TITLE} is required — it's the fallback every other language uses.`,
  )

// Optional field: may be empty entirely, but adding any translation requires
// the default-language value too (otherwise the fallback renders blank).
export const englishIfAny = (Rule) =>
  Rule.custom((value) => {
    const hasAny = (value ?? []).some(hasValue)
    if (!hasAny) return true
    return hasValue(defaultLanguageItem(value))
      ? true
      : `Add the ${DEFAULT_TITLE} version too — it's the fallback every other language uses.`
  })
