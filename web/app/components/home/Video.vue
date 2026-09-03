<template>
  <section
    v-if="playable"
    class="video-module"
  >
    <div class="media-wrap">
      <video
        v-if="module.videoType === 'mp4'"
        ref="videoEl"
        class="player"
        :src="module.videoUrl"
        controls
        playsinline
        preload="metadata"
      ></video>

      <!-- Mounted only once playing: no third-party requests until the
           visitor opts in by clicking the poster. -->
      <iframe
        v-else-if="playing"
        class="player"
        :src="`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`"
        title=""
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowfullscreen
      ></iframe>

      <Transition name="poster-fade">
        <button
          v-if="!playing"
          class="poster"
          @click="play"
        >
          <img
            :src="urlFor(module.poster, { w: 2400 })"
            :alt="module.poster.alt || ''"
          />
          <span class="watch uppercase">
            <IconsPlay />

            {{ module.buttonText || $t('video.watch') }}
          </span>
        </button>
      </Transition>
    </div>
  </section>
</template>

<script setup>
/**
 * Home + info module: a click-to-play video in the headline-over-image media
 * geometry — centered, rounded, 16:9. The poster (with a "watch" pill) fades
 * out on click, revealing an uploaded MP4 with native controls or a YouTube
 * embed that autoplays. Renders nothing without a playable source, so a
 * half-filled draft can't leave a dead poster on the page.
 */
const props = defineProps({
  module: { type: Object, required: true },
})

const urlFor = useSanityImage()
const videoEl = ref(null)
const playing = ref(false)

const videoId = computed(() => youtubeId(props.module.youtubeUrl))

const playable = computed(() =>
  props.module.videoType === 'youtube' ? Boolean(videoId.value) : Boolean(props.module.videoUrl),
)

// The click satisfies autoplay policy, so the MP4 starts with sound; the
// YouTube iframe mounts with autoplay=1 for the same effect.
const play = () => {
  playing.value = true
  videoEl.value?.play()
}
</script>

<style scoped>
.video-module {
  /* Inert in home's block flow; spans the info page's 12-col grid, where
     modules place themselves. */
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  padding: 0 var(--spacing-base);
}

/* The headline-over-image media geometry, so the two modules read as one
   family. overflow clips the video/iframe corners to the radius. */
.media-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 55svh;
  border-radius: var(--radius-def);
  overflow: hidden;

  @media (min-width: 768px) {
    width: 55%;
  }
}

.player {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  object-fit: cover;
}

.poster {
  position: absolute;
  inset: 0;
  padding: 0;
  background: none;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.poster-fade-leave-active {
  transition: opacity 0.5s;
}

.poster-fade-leave-to {
  opacity: 0;
}

.watch {
  position: absolute;
  bottom: var(--spacing-base);
  left: var(--spacing-base);
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border-radius: 0.4rem;
  padding: 0.4rem 1rem;
  background-color: var(--color-black);
  color: var(--color-white);
}

.watch :deep(.icon-play) {
  width: 1em;
  flex: none;
}
</style>
