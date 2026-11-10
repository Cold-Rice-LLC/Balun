<template>
  <section
    v-if="playable"
    class="video-module"
  >
    <div class="media-wrap">
      <mux-video
        v-if="module.videoType === 'mux'"
        ref="videoEl"
        class="player"
        :playback-id="module.playbackId"
        controls
        playsinline
        preload="metadata"
      ></mux-video>

      <!-- Mounted only once playing: no third-party requests until the
           visitor opts in by clicking the poster. -->
      <iframe
        v-else-if="playing"
        class="player"
        :src="embedUrl"
        :title="$t('video.player')"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowfullscreen
      ></iframe>

      <Transition name="poster-fade">
        <button
          v-if="!playing"
          class="poster"
          @click="play"
        >
          <!-- contents: the img sizes against the button, as without the
               picture. Phones download only the mobile poster when set. -->
          <picture class="contents">
            <source
              v-if="mobilePoster"
              media="(min-width: 768px)"
              :srcset="urlFor(module.poster, { w: 2400 })"
            />
            <img
              :src="urlFor(mobilePoster || module.poster, { w: mobilePoster ? 1200 : 2400 })"
              :loading="isLead ? 'eager' : 'lazy'"
              :fetchpriority="isLead ? 'high' : undefined"
              :alt="(mobilePoster || module.poster).alt || ''"
            />
          </picture>
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
 * out on click, revealing a Mux upload with native controls (Mux's
 * <mux-video>, a drop-in <video> streaming adaptive HLS) or a Vimeo/YouTube
 * embed that autoplays. Renders nothing without a playable source, so a
 * half-filled draft can't leave a dead poster on the page.
 */
const props = defineProps({
  module: { type: Object, required: true },
})

const urlFor = useSanityImage()
const mobilePoster = computed(() => (props.module.mobilePoster?.asset ? props.module.mobilePoster : null))
const isLead = useIsLeadModule(props.module)
const videoEl = ref(null)
const playing = ref(false)

const embedUrl = computed(() => {
  if (props.module.videoType === 'vimeo') return vimeoEmbedUrl(props.module.vimeoUrl)
  const id = youtubeId(props.module.youtubeUrl)
  return id && `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`
})

const playable = computed(() =>
  props.module.videoType === 'mux' ? Boolean(props.module.playbackId) : Boolean(embedUrl.value),
)

// <mux-video> registers itself on import, which touches window — so
// client-only, after mount, and only when this module plays one.
onMounted(() => {
  if (props.module.videoType === 'mux') import('@mux/mux-video')
})

// The click satisfies autoplay policy, so the Mux video starts with sound;
// the embeds mount with autoplay=1 for the same effect.
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
  padding: 0 var(--spacing-gutter);
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
  /* <mux-video> cover-fits its inner <video> through this. */
  --media-object-fit: cover;
}

.poster {
  position: absolute;
  inset: 0;
  padding: 0;
  background: none;
  border-radius: inherit;

  /* The wrap's overflow clip swallows the default offset ring; draw it
     inside, along the rounded corners, in the accent rather than the
     button's default black — this sits on a photo, not a page, and white
     got lost in it. */
  &:focus-visible {
    outline-color: var(--color-yellow);
    outline-offset: -0.2rem;
  }

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
  gap: var(--spacing-xs);
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
