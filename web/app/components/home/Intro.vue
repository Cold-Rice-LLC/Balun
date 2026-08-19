<template>
  <div
    class="home-intro fixed inset-0 overflow-hidden"
    aria-hidden="true"
  >
    <!-- White sheet the explosion tears a hole through to reveal the page -->
    <div
      class="absolute inset-0 bg-white"
      :style="maskStyle"
    />
    <img
      v-for="body in bodies"
      :key="body.id"
      :src="body.src"
      alt=""
      class="pointer-events-none absolute select-none"
      :style="{
        left: `${body.centerX - body.centroidOffsetX}px`,
        top: `${body.centerY - body.centroidOffsetY}px`,
        width: `${body.width}px`,
        height: `${body.height}px`,
        transform: `rotate(${body.angle}rad)`,
        transformOrigin: `${body.centroidOffsetX}px ${body.centroidOffsetY}px`,
      }"
    />
  </div>
</template>

<script setup>
/**
 * Home-page intro: the BALUN letters, shoes and character fall into a
 * matter.js world (usePhysics), settle, then explode outward while a radial
 * hole grows in the white sheet, revealing the live page underneath.
 * Animation ported from channelstudio/balun.
 *
 * The home shell is edge-cached per locale (docs/performance-caching.md), so
 * SSR can't vary on a cookie. Instead the overlay is always in the SSR HTML
 * but display:none until the inline head script below — running before first
 * paint — adds `intro-pending` to <html> when the intro should play. No
 * flash either way, one cacheable shell for everyone. The class stays on for
 * the whole play (it's what shows the overlay pre- and post-hydration) and
 * comes off at the end.
 *
 * Seen-state is a 15-minute cookie set at play start, so the intro returns
 * 15 minutes after it last played.
 */

// Demo flag: while showing the client, the intro plays on every reload.
// Flip to false to arm the 15-minute cookie for real.
const INTRO_ON_EVERY_LOAD = true

const COOKIE_NAME = 'balun-intro-seen'
const COOKIE_MAX_AGE = 15 * 60

const EXPLOSION_DELAY_MS = 3500
const REVEAL_DURATION_MS = 1800
// Buffer after the reveal completes before unmounting, while the last
// pieces fly offscreen.
const FINISH_BUFFER_MS = 300

// Display widths designed against a 1440px viewport; scaled down below it
const svgDefs = [
  { src: '/svgs/Vector_RedShoe.svg', w: 500, ratio: 706 / 587 },
  { src: '/svgs/Vector_GrayShoe.svg', w: 450, ratio: 721 / 593 },
  { src: '/svgs/Vector_PurpleShoe.svg', w: 483, ratio: 375 / 815 },
  { src: '/svgs/vector_Character.svg', w: 300, ratio: 516 / 531 },
  { src: '/svgs/Vector_B.svg', w: 225, ratio: 315 / 258 },
  { src: '/svgs/Vector_A.svg', w: 248, ratio: 256 / 261 },
  { src: '/svgs/Vector_L.svg', w: 225, ratio: 231 / 384 },
  { src: '/svgs/Vector_U.svg', w: 200, ratio: 221 / 221 },
  { src: '/svgs/Vector_N.svg', w: 200, ratio: 208 / 207 },
]

// Decides before first paint whether the intro plays: skipped for reduced
// motion, and for anyone who saw it in the last 15 minutes. When it will
// play, also preloads the SVGs so spawn isn't stalled on their fetches —
// non-playing visitors never download them.
useHead({
  script: [
    {
      key: 'home-intro-gate',
      innerHTML:
        '(function(){' +
        `var seen=document.cookie.indexOf('${COOKIE_NAME}=')!==-1;` +
        "var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;" +
        `if(reduced||!(${INTRO_ON_EVERY_LOAD}||!seen))return;` +
        "document.documentElement.classList.add('intro-pending');" +
        `${JSON.stringify(svgDefs.map((def) => def.src))}.forEach(function(src){` +
        "var link=document.createElement('link');link.rel='preload';link.as='image';link.href=src;document.head.appendChild(link)});" +
        '})()',
    },
  ],
})

const emit = defineEmits(['done'])

// Own refs over useWindowSize: the viewport can still measure 0×0 at mount
// (hidden/prerendered tabs), and useWindowSize only corrects itself on a
// resize event. play() below polls these until they're real.
const containerW = ref(0)
const containerH = ref(0)
const syncViewport = () => {
  containerW.value = window.innerWidth
  containerH.value = window.innerHeight
}
useEventListener('resize', syncViewport)

const { bodies, addBody, start, stop, explode } = usePhysics(containerW, containerH, {
  gravity: 1.2,
  restitution: 0.6,
  friction: 0.05,
  frictionAir: 0.01,
  explosionIntensity: 60,
})

const playing = ref(false)
useScrollLock(playing)

const explosionX = ref(0)
const explosionY = ref(0)
const rawRevealRadius = ref(0)
const revealRadius = useTransition(rawRevealRadius, {
  duration: REVEAL_DURATION_MS,
  transition: [0.19, 1, 0.22, 1],
})

// The hole in the sheet: fully clear inside 65% of the radius, soft edge to
// 100%. The radius is sized at explosion time so the 65% mark covers the
// farthest viewport corner — no residual haze on any screen.
const maskStyle = computed(() => {
  if (revealRadius.value < 1) return {}
  const gradient = `radial-gradient(circle ${revealRadius.value}px at ${explosionX.value}px ${explosionY.value}px, transparent 0%, transparent 65%, black 100%)`
  return { maskImage: gradient, WebkitMaskImage: gradient }
})

const spawnBodies = () => {
  const scale = Math.min(1, containerW.value / 1440)
  svgDefs.forEach((def, i) => {
    const w = Math.round(def.w * scale)
    const h = Math.round(w * def.ratio)
    addBody({
      src: def.src,
      x: Math.random() * Math.max(0, containerW.value - w),
      // Half a viewport up, staggered so pieces trail in — a full viewport
      // left the screen empty too long, right at the edge felt abrupt
      y: -containerH.value / 2 - h - i * 80,
      vx: (Math.random() - 0.5) * 3,
      vy: 0,
      width: w,
      height: h,
    })
  })
}

let rafId = 0
const timeoutIds = []

const play = () => {
  // Wait out a 0×0 viewport (hidden/prerendered tab) — degenerate physics
  // bodies otherwise. The clock starts when we can actually be seen.
  syncViewport()
  if (!containerW.value || !containerH.value) {
    rafId = requestAnimationFrame(play)
    return
  }

  start()
  spawnBodies()

  // Arm the clock off the first rendered frame, not mount: in a hidden tab
  // rAF is paused, so a background-tab load holds the intro (bodies frozen,
  // timers unarmed) until the tab is actually looked at.
  rafId = requestAnimationFrame(armTimers)
}

const armTimers = () => {
  timeoutIds.push(
    setTimeout(() => {
      explosionX.value = containerW.value / 2
      explosionY.value = containerH.value
      explode(explosionX.value, explosionY.value)
      // Sized so the fully-clear 65% band reaches the farthest corner
      rawRevealRadius.value = Math.hypot(containerW.value / 2, containerH.value) / 0.65
    }, EXPLOSION_DELAY_MS),

    setTimeout(() => {
      playing.value = false
      document.documentElement.classList.remove('intro-pending')
      emit('done')
    }, EXPLOSION_DELAY_MS + REVEAL_DURATION_MS + FINISH_BUFFER_MS),
  )
}

onMounted(() => {
  // The head script didn't arm the intro (seen recently / reduced motion) —
  // the overlay was never visible, remove it without playing.
  if (!document.documentElement.classList.contains('intro-pending')) {
    emit('done')
    return
  }

  // Mark seen at play start so the 15 minutes counts from the last play
  const introSeen = useCookie(COOKIE_NAME, { maxAge: COOKIE_MAX_AGE })
  introSeen.value = '1'

  playing.value = true
  play()
})

onUnmounted(() => {
  stop()
  cancelAnimationFrame(rafId)
  timeoutIds.forEach(clearTimeout)
})
</script>

<style>
/* Hidden in the cached SSR shell; the pre-paint head script shows it by
   classing <html> when the intro should play. Above the drawers (4900). */
.home-intro {
  display: none;
  z-index: 9000;
}

html.intro-pending .home-intro {
  display: block;
}
</style>
