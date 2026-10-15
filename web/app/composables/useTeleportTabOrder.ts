import type { Ref } from 'vue'

/**
 * Puts teleported content back in the tab order where it belongs. A
 * <Teleport to="body"> moves its content to the end of the document, so Tab
 * reaches it only after the footer. This makes Tab treat `content`'s
 * focusable elements as if they sat right after `anchor`'s own: Tab out of
 * the anchor goes into the content, Tab out of the content continues after
 * the anchor, and Shift+Tab runs the same path backwards.
 *
 * Content that hides itself (faded out and inert) still counts: stepping
 * into it calls `reveal`, and focus lands once the caller has re-rendered
 * it focusable. `enabled` false takes the content out of the order
 * altogether.
 *
 * Only steps that touch the spliced-in content are taken over; every other
 * Tab is left to the browser. Listens on window, after the document-level
 * overlay trap (useOverlayFocus), and stands down when the trap has handled
 * the key.
 */
export const useTeleportTabOrder = (
  anchor: Ref<HTMLElement | null | undefined>,
  content: Ref<HTMLElement | null | undefined>,
  { enabled, reveal }: { enabled: Ref<boolean>; reveal: () => void },
) => {
  const onKeydown = async (e: KeyboardEvent) => {
    const anchorEl = anchor.value
    const contentEl = content.value
    if (e.key !== 'Tab' || e.defaultPrevented || !enabled.value || !anchorEl || !contentEl) return
    const spliced = tabbables(contentEl, [], { includeInert: true })
    if (!spliced.length) return

    const all = tabbables(document.body)
    const rest = all.filter((el) => !contentEl.contains(el))
    // After the anchor's last stop; with none, before the first stop past it.
    let at = rest.findLastIndex((el) => anchorEl.contains(el)) + 1
    if (!at) {
      at = rest.findIndex((el) => anchorEl.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
      if (at === -1) at = rest.length
    }
    const order = [...rest.slice(0, at), ...spliced, ...rest.slice(at)]

    const current = document.activeElement as HTMLElement
    const step = e.shiftKey ? -1 : 1
    const i = order.indexOf(current)
    if (i === -1) return
    const next = order[i + step]
    if (!next || next === all[all.indexOf(current) + step]) return
    e.preventDefault()
    if (contentEl.contains(next) && next.closest('[inert]')) {
      reveal()
      await nextTick()
    }
    next.focus()
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
