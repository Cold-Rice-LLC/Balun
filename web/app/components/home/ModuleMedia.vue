<template>
  <video
    v-if="media.mediaType === 'video' && media.playbackId && !streamFallback"
    ref="mp4"
    class="module-media"
    :src="`https://stream.mux.com/${media.playbackId}/highest.mp4`"
    :poster="poster"
    autoplay
    muted
    loop
    playsinline
    disablepictureinpicture
    aria-hidden="true"
    @error="useStream"
  >
    <!-- Decorative background loop (no sound, no controls, no alt field in
         the Studio): hidden from assistive tech. -->
  </video>

  <mux-video
    v-else-if="media.mediaType === 'video' && media.playbackId"
    class="module-media"
    :playback-id="media.playbackId"
    :poster="poster"
    autoplay
    muted
    loop
    playsinline
    disablepictureinpicture
    aria-hidden="true"
  ></mux-video>

  <picture
    v-else-if="media.image"
    class="module-media-frame"
  >
    <!-- picture, not a hidden-img pair: phones never download the desktop
         asset and vice versa. The picture is the styled root — parents'
         scoped .media rules (radius, positioning) only reach the component's
         root, and only while the template stays single-root: a fragment
         disables scope-id/attr inheritance, and even a ROOT-LEVEL COMMENT
         between the v-if branches fragments it in dev — keep comments
         inside the elements. -->
    <source
      v-if="mobileImage"
      media="(min-width: 768px)"
      :srcset="urlFor(media.image, { w: 2400 })"
    />
    <img
      class="module-media"
      :src="urlFor(mobileImage || media.image, { w: mobileImage ? 1200 : 2400 })"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      :alt="(mobileImage || media.image).alt || ''"
    />
  </picture>
</template>

<script setup>
/**
 * The media half of the big-image home modules: an image, or a Mux video
 * playing as a silent loop, its first frame as the poster. The loop plays
 * Mux's plain MP4 of the upload in a native <video>: a few muted seconds
 * don't need adaptive streaming, and skipping it skips Mux's ~240KB player.
 * An upload without an MP4 (from before the Studio asked for them, or still
 * being prepared) errors, and the loop falls back to that player
 * (<mux-video>, adaptive HLS), imported only then — it touches window on
 * import, which also keeps it client-only. Renders nothing when the chosen media
 * type's asset is missing, so modules can drop it in unguarded. The parent
 * positions it; cover-fitting is here since every user wants it.
 *
 * `media.mobileImage` (optional, every hero module) swaps in a phone image
 * under 768px — image media only, via <picture>, so each viewport downloads
 * exactly one asset. Video media ignores it (the Studio hides the field
 * there): supporting it would mean a second root and losing the parents'
 * scoped styling of the root.
 */
const props = defineProps({
  media: { type: Object, required: true },
  // The page's lead image: load immediately at high priority (still fades).
  eager: { type: Boolean, default: false },
})

const urlFor = useSanityImage()

// An image field left with only alt text (asset removed) counts as empty.
const mobileImage = computed(() => (props.media.mobileImage?.asset ? props.media.mobileImage : null))

const poster = computed(
  () => `https://image.mux.com/${props.media.playbackId}/thumbnail.webp?time=0&width=1920`,
)

const mp4 = ref(null)
const streamFallback = ref(false)
const useStream = () => {
  import('@mux/mux-video')
  streamFallback.value = true
}

// The server-rendered <video> starts loading before hydration, so a missing
// MP4 can error before @error is listening.
onMounted(() => {
  if (mp4.value?.error) useStream()
})
</script>

<style scoped>
/* overflow so a parent's border-radius on the frame clips the img. */
.module-media-frame {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.module-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* The <mux-video> fallback cover-fits its inner <video> through this. */
  --media-object-fit: cover;
}
</style>
