import { INTRO_COOKIE, INTRO_COOKIE_MAX_AGE } from '~/intro/config'

/**
 * Starts the home intro the moment the app's script runs — before the page
 * hydrates — on the overlay the server already painted (components/home/
 * Intro.vue). Waiting for hydration meant waiting on every component and
 * the page's data while the visitor stared at a white sheet.
 *
 * matter.js and the play load as their own chunk, in parallel with the rest
 * of the app. When the play ends (or can't start) it uncovers the page and
 * flips `home-intro-done`, which removes the overlay component.
 */
export default defineNuxtPlugin({
  name: 'home-intro',
  parallel: true,
  setup() {
    const html = document.documentElement
    // Only the home page's head gate sets this, and only when the intro plays.
    if (!html.classList.contains('intro-pending')) return

    const done = useState('home-intro-done', () => false)
    const finish = () => {
      html.classList.remove('intro-pending')
      done.value = true
    }

    const root = document.querySelector<HTMLElement>('.home-intro')
    if (!root) return finish()

    // Marked seen at play start, so the 15 minutes count from the last play.
    document.cookie = `${INTRO_COOKIE}=1; max-age=${INTRO_COOKIE_MAX_AGE}; path=/; samesite=lax`

    import('~/intro/runIntro')
      .then(({ runIntro }) => runIntro(root, finish))
      .catch(finish)
  },
})
