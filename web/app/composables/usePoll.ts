/**
 * Calls `refresh` every `every()` ms while the tab is visible; `every()`
 * returning null pauses it. A hidden tab doesn't poll at all (browsers only
 * throttle timers, and at this audience size every skipped request is
 * billed traffic saved); coming back to the tab refreshes at once if a poll
 * came due meanwhile. Client-only: the server render never sets a timer.
 */
export const usePoll = (refresh: () => unknown, every: () => number | null) => {
  if (import.meta.server) return

  const visibility = useDocumentVisibility()
  let last = Date.now()
  const tick = () => {
    last = Date.now()
    refresh()
  }

  const { pause, resume } = useIntervalFn(
    () => visibility.value === 'visible' && tick(),
    () => every() ?? 0,
    { immediate: false },
  )
  watch(() => every() !== null, (on) => (on ? resume() : pause()), { immediate: true })

  watch(visibility, (state) => {
    const ms = every()
    if (state === 'visible' && ms !== null && Date.now() - last >= ms) tick()
  })
}
