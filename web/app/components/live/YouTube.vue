<template>
  <div class="live-youtube">
    <iframe
      v-if="mounted"
      class="player"
      :class="{ 'is-loaded': loaded }"
      :src="`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`"
      title=""
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      allowfullscreen
      @load="loaded = true"
    ></iframe>

    <p
      class="loading font-secondary text-base uppercase leading-[1.2]"
      :class="{ 'is-done': loaded }"
      :aria-hidden="loaded"
      role="status"
    >
      {{ $t('live.connecting') }}
    </p>
  </div>
</template>

<script setup>
/**
 * The live stream as a YouTube embed, for broadcasts that run on YouTube
 * rather than through Mux (see docs/live-streaming.md). Autoplays muted —
 * the stream is the whole point of the page, and muted is what autoplay
 * policy allows; the player's own controls unmute. Unlike the home video
 * module there's no click-to-play poster holding the third-party request
 * back, so YouTube is contacted as soon as the page renders live.
 *
 * The frame holds a "connecting" note from the first paint, and the two
 * cross-fade once the embed loads — so the stage reads as waiting rather
 * than broken, and never flashes white on the way in. The iframe mounts
 * after hydration rather than server-rendering: the load event has to have
 * somewhere to land, and one in the SSR'd HTML can finish loading before Vue
 * attaches the handler, which would leave the player faded out for good.
 */
defineProps({
  videoId: { type: String, required: true },
})

const mounted = ref(false)
const loaded = ref(false)

onMounted(() => {
  mounted.value = true
})
</script>

<style scoped>
/* The home video module's media geometry, so the two read as one family.
   The iframe letterboxes itself where max-height bites. */
.live-youtube {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 55svh;
  border-radius: var(--radius-def);
  overflow: hidden;
  background-color: var(--color-black);
}

.player {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  opacity: 0;
  transition: opacity 0.5s;
}

.player.is-loaded {
  opacity: 1;
}

/* Centered in the frame, over the player — so it must never swallow clicks
   meant for the controls. */
.loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-grey-3);
  pointer-events: none;
  transition: opacity 0.5s;
}

.loading.is-done {
  opacity: 0;
}
</style>
