const TABBABLE = 'a[href], button, input, select, textarea, summary, [tabindex]'

/**
 * The elements Tab would stop on inside `root`, plus any `extra` (controls
 * elsewhere that belong with it), in document order: focusable, not
 * disabled, inert, hidden or tabindex -1. A radio group counts once — its
 * checked radio, else its first. `includeInert` keeps the stops of content
 * that is inert only until it's revealed.
 */
export const tabbables = (
  root: ParentNode,
  extra: (HTMLElement | null | undefined)[] = [],
  { includeInert = false } = {},
) => {
  const els = [...root.querySelectorAll<HTMLElement>(TABBABLE), ...extra].filter(
    (el): el is HTMLElement =>
      !!el &&
      el.tabIndex >= 0 &&
      !(el as HTMLButtonElement).disabled &&
      (includeInert || !el.closest('[inert]')) &&
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== 'hidden' &&
      !(
        el instanceof HTMLInputElement &&
        el.type === 'radio' &&
        el !==
          (root.querySelector<HTMLInputElement>(`input[type=radio][name="${el.name}"]:checked`) ??
            root.querySelector<HTMLInputElement>(`input[type=radio][name="${el.name}"]`))
      ),
  )
  return [...new Set(els)].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
}
