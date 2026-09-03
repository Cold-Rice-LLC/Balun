<template>
  <mux-player
    class="live-player"
    stream-type="live"
    :playback-id="playbackId"
    autoplay
    muted
    playsinline
  ></mux-player>
</template>

<script setup>
/**
 * The live stream player: Mux's web component in live mode (live badge,
 * seek-to-live, no duration scrubbing), playing the stream by playback ID.
 * Starts muted so autoplay is allowed; the player's own controls unmute.
 * The element registers itself on import, which touches window — so
 * client-only, after mount. Server-rendered as an empty custom element
 * until then.
 */
defineProps({
  playbackId: { type: String, required: true },
})

onMounted(() => import('@mux/mux-player'))
</script>

<style scoped>
.live-player {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-def);
  overflow: hidden;
  background-color: var(--color-black);
}
</style>
