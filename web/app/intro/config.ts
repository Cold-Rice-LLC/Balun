// Demo flag: while showing the client, the intro plays on every reload.
// Flip to false to arm the 15-minute cookie for real.
export const INTRO_ON_EVERY_LOAD = true

// Seen-state: set when the intro starts, so it returns 15 minutes after it
// last played.
export const INTRO_COOKIE = 'balun-intro-seen'
export const INTRO_COOKIE_MAX_AGE = 15 * 60

// Last resort: if the app's script never boots the intro (a failed load),
// the head gate pulls the overlay after this long rather than leave the page
// covered.
export const INTRO_FAILSAFE_MS = 10000
