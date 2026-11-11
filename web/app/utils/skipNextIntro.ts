/**
 * A locale switch is a hard reload that lands back on the same page, and the
 * home intro shouldn't replay over it. The value is a timestamp so it can only
 * suppress the load it belongs to: the intro's gate script consumes it and
 * ignores anything stale, such as a switch made from another page (see
 * components/home/Intro.vue).
 */
export const skipNextIntro = () => {
  try {
    sessionStorage.setItem('balun-intro-skip', String(Date.now()))
  } catch {
    // Storage unavailable (privacy mode), so the intro just plays.
  }
}
