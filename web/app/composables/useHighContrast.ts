// High-contrast mode (Site Settings "Accessibility — High-Contrast Toggle").
// The mode is a class on <html>; global.css and the components key their
// high-contrast colors on it. Pages are cached and shared, so the server
// never renders it: a pre-paint head script (ContrastToggle) adds the class
// from the visitor's saved choice — or their device's "more contrast"
// setting when they haven't chosen — before anything shows.
export const HIGH_CONTRAST_CLASS = 'high-contrast'
export const HIGH_CONTRAST_KEY = 'balun-contrast'

export const useHighContrast = () => {
  const on = useState('high-contrast', () => false)

  // Read what the head script decided. No save: a visitor who never pressed
  // the button keeps following their device setting.
  const sync = () => {
    on.value = document.documentElement.classList.contains(HIGH_CONTRAST_CLASS)
  }

  // The button: switch and remember.
  const toggle = () => {
    on.value = !on.value
    document.documentElement.classList.toggle(HIGH_CONTRAST_CLASS, on.value)
    try {
      localStorage.setItem(HIGH_CONTRAST_KEY, on.value ? 'high' : 'standard')
    } catch {
      // Storage blocked: the mode still applies until the page reloads.
    }
  }

  // Switch turned off in Site Settings: drop the mode, keep the saved choice.
  const disable = () => {
    on.value = false
    document.documentElement.classList.remove(HIGH_CONTRAST_CLASS)
  }

  return { on: readonly(on), sync, toggle, disable }
}
