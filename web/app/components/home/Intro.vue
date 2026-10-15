<template>
  <!-- data-allow-mismatch: the intro may already be playing on this markup
       (transforms, the sheet's mask) when the app hydrates it. -->
  <div
    class="home-intro fixed inset-0 overflow-hidden"
    aria-hidden="true"
    data-allow-mismatch
  >
    <!-- White sheet the explosion tears a hole through to reveal the page -->
    <div class="intro-sheet absolute inset-0 bg-white" />
    <img
      v-for="piece in INTRO_PIECES"
      :key="piece.src"
      :src="piece.src"
      alt=""
      class="intro-piece pointer-events-none absolute select-none"
      :style="introStartStyle(piece)"
      loading="lazy"
      draggable="false"
    />
  </div>
</template>

<script setup>
/**
 * Home-page intro: the BALUN letters, shoes and character fall into a
 * matter.js world, settle, then pop outward while a hole tears open in the
 * white sheet, revealing the live page underneath. Animation ported from
 * channelstudio/balun.
 *
 * This component only renders the first frame — the white sheet, with every
 * piece waiting just above the screen (intro/pieces.ts). The play itself is
 * intro/runIntro.ts, started by plugins/intro.client.ts as soon as the app's
 * script runs, before hydration; it reports back through the
 * `home-intro-done` state.
 *
 * The home shell is edge-cached per locale (docs/performance-caching.md), so
 * SSR can't vary on a cookie. Instead the overlay is always in the SSR HTML
 * but display:none until the inline head script below — running before first
 * paint — adds `intro-pending` to <html> when the intro should play. The
 * class stays on for the whole play and comes off at the end. Lazy pieces in
 * a hidden overlay never download, so visitors who skip it don't pay for it.
 *
 * Seen-state is a 15-minute cookie set at play start, so the intro returns
 * 15 minutes after it last played.
 *
 * A market/language switch is a hard reload of the same page (see
 * LocaleModal) — it stamps sessionStorage, and a fresh stamp skips the play
 * even while the demo flag forces it on every ordinary load.
 */
import { INTRO_COOKIE, INTRO_FAILSAFE_MS, INTRO_ON_EVERY_LOAD } from '~/intro/config'
import { INTRO_PIECES, introStartStyle } from '~/intro/pieces'

// Decides before first paint whether the intro plays: skipped for reduced
// motion, and for anyone who saw it in the last 15 minutes. When it will
// play, also preloads the SVGs so the first frame paints them at once, and
// arms the failsafe that uncovers the page if the app never boots the play.
useHead({
  script: [
    {
      key: 'home-intro-gate',
      innerHTML:
        '(function(){' +
        `var seen=document.cookie.indexOf('${INTRO_COOKIE}=')!==-1;` +
        "var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;" +
        "var sw=false;try{var v=+sessionStorage.getItem('balun-intro-skip');sessionStorage.removeItem('balun-intro-skip');sw=Date.now()-v<60000}catch(e){}" +
        `if(reduced||sw||!(${INTRO_ON_EVERY_LOAD}||!seen))return;` +
        'var html=document.documentElement;html.classList.add(\'intro-pending\');' +
        `setTimeout(function(){html.classList.remove('intro-pending')},${INTRO_FAILSAFE_MS});` +
        `${JSON.stringify([...new Set(INTRO_PIECES.map((piece) => piece.src))])}.forEach(function(src){` +
        "var link=document.createElement('link');link.rel='preload';link.as='image';link.href=src;document.head.appendChild(link)});" +
        '})()',
    },
  ],
})

const emit = defineEmits(['done'])

const finished = useState('home-intro-done', () => false)

onMounted(() => {
  // The head script didn't arm the intro (seen recently / reduced motion), or
  // it already finished — the overlay isn't showing, remove it.
  if (!document.documentElement.classList.contains('intro-pending')) {
    emit('done')
    return
  }
  watch(finished, (done) => done && emit('done'), { immediate: true })
})
</script>

<style>
/* Hidden in the cached SSR shell; the pre-paint head script shows it by
   classing <html> when the intro should play. Above the drawers (4900).
   touch-action covers iOS, where overflow: hidden alone doesn't stop touch
   panning — the fixed overlay receives every touch while it's up. */
.home-intro {
  display: none;
  z-index: var(--z-intro);
  touch-action: none;
}

html.intro-pending .home-intro {
  display: block;
}

/* Shown at once, not through the global lazy-image fade (that waits on
   hydration); moved by transform every frame and faded at the end. */
.home-intro .intro-piece {
  opacity: 1;
  will-change: transform, opacity;
}

/* Page pinned for the whole play — keyed on the html class (not a JS lock,
   which couldn't arm until hydration) so it holds from the first paint and
   releases the instant the play pulls the class. */
html.intro-pending,
html.intro-pending body {
  overflow: hidden;
}
</style>
