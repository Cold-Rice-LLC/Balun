<template>
  <iframe
    v-if="mounted"
    class="live-youtube"
    :class="{ 'is-loaded': loaded }"
    :src="`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`"
    title=""
    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
    allowfullscreen
    @load="loaded = true"
  ></iframe>
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
 * It fades up once the embed loads, so the stage goes black → stream rather
 * than black → white flash → stream. Mounted after hydration rather than
 * server-rendered: the load event has to have somewhere to land, and an
 * iframe in the SSR'd HTML can finish loading before Vue attaches the
 * handler — which would leave the player faded out for good.
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
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 55svh;
  border: 0;
  border-radius: var(--radius-def);
  background-color: var(--color-black);
  opacity: 0;
  transition: opacity 0.5s;
}

.live-youtube.is-loaded {
  opacity: 1;
}
</style>
