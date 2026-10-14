import type { Ref } from 'vue'

/**
 * 404 for a page whose Sanity doc didn't resolve. Throws on the initial / SSR
 * miss; client-side navigation to another unknown slug doesn't re-run setup,
 * so it also guards reactively once the in-place refetch resolves to nothing.
 */
export const useNotFound = (data: Ref<unknown>, statusMessage: string) => {
  if (!data.value) {
    throw createError({ statusCode: 404, statusMessage, fatal: true })
  }
  watch(data, (value) => {
    if (!value) showError({ statusCode: 404, statusMessage })
  })
}
