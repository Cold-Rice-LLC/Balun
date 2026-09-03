<template>
  <div class="live-player">
    <mux-player
      ref="player"
      :key="attempt"
      class="player"
      :class="{ 'is-ready': ready }"
      stream-type="live"
      :playback-id="playbackId"
      autoplay
      :muted="muted"
      playsinline
      nohotkeys
      nomutedpref
      @canplay="ready = true"
      @error="onError"
    ></mux-player>

    <p
      class="loading font-secondary text-base uppercase leading-[1.2]"
      :class="{ 'is-done': ready }"
      :aria-hidden="ready"
      role="status"
    >
      {{ $t('live.connecting') }}
    </p>
  </div>
</template>

<script setup>
/**
 * The live stream player: Mux's web component in live mode, playing the
 * stream by playback ID as a bare picture — no controls, spinner, hotkeys
 * or click-to-pause, and the video covers the frame (object-fit cover,
 * centered) rather than letterboxing in it. Starts muted so autoplay is
 * allowed; `muted` is a model, so whoever lays the player out can put a
 * mute toggle wherever suits (there's nothing on the player itself). The
 * player would otherwise remember an unmute across visits (nomutedpref
 * stops it), and a return visit starting unmuted would be autoplay-blocked.
 * Unmuting also starts playback if a browser did block the muted autoplay:
 * the click behind it is the gesture playback needs, and with no controls
 * it's the only one the viewer will make. The element registers itself on import, which touches window — so
 * client-only, after mount. Server-rendered as an empty custom element
 * until then.
 *
 * Like the YouTube embed, the frame holds a "connecting" note until the
 * player can actually play, then the two cross-fade — `canplay` rather than
 * `playing`, so a blocked autoplay still reveals the player and its play
 * button. Between the webhook flipping Live Now and Mux serving the first
 * HLS segments the playback ID answers 412. The player retries that by
 * itself, but only six times (5s, then every 60s) before giving up — and
 * with Live Now set by hand the gap can be as long as it takes the streamer
 * to press Start. So its "Retrying…" dialog is hidden (--dialog) and a
 * fatal error before anything has played remounts the player a minute
 * later: a fresh element starts a fresh retry cycle, so the stage polls
 * for the stream about once a minute for as long as Live Now stays on,
 * reading as connecting rather than broken. (The player flags its retry
 * errors fatal too, so the minute counts from the first miss, not the
 * sixth — which is fine: it's the same poll, without the cap.)
 */
defineProps({
  playbackId: { type: String, required: true },
})

const muted = defineModel('muted', { type: Boolean, default: true })
const player = useTemplateRef('player')
const ready = ref(false)
const attempt = ref(0)
let retryTimer

watch(muted, (isMuted) => {
  if (!isMuted && player.value?.paused) player.value.play()
})

const onError = (event) => {
  const error = event.detail ?? event.target?.error
  if (ready.value || !error?.fatal) return
  clearTimeout(retryTimer)
  retryTimer = setTimeout(() => {
    attempt.value += 1
  }, 60_000)
}

onMounted(() => import('@mux/mux-player'))
onBeforeUnmount(() => clearTimeout(retryTimer))
</script>

<style scoped>
.live-player {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-def);
  overflow: hidden;
  background-color: var(--color-black);
}

/* The picture and nothing else: every layer of chrome off, and no pointer
   interaction so a click can't pause it. */
.player {
  --controls: none;
  --loading-indicator: none;
  --dialog: none;
  --media-object-fit: cover;
  --media-object-position: center;

  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
}

.player.is-ready {
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
