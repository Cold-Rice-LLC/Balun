// Demo flag: true makes the intro play on every reload, ignoring the cookie.
export const INTRO_ON_EVERY_LOAD = false

// Seen-state: the intro plays once per visit. A visit ends after 30 minutes
// without a page view (the analytics definition), so every page view renews
// the cookie. Not a browser-session cookie: browsers that restore sessions
// keep those for days.
export const INTRO_COOKIE = 'balun-intro-seen'
export const INTRO_COOKIE_MAX_AGE = 30 * 60

// Last resort: if the app's script never boots the intro (a failed load),
// the head gate pulls the overlay after this long rather than leave the page
// covered.
export const INTRO_FAILSAFE_MS = 10000
