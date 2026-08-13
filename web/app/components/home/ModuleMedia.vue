<template>
  <video
    v-if="media.mediaType === 'video' && media.videoUrl"
    class="module-media"
    :src="media.videoUrl"
    autoplay
    muted
    loop
    playsinline
    disablepictureinpicture
  ></video>

  <img
    v-else-if="media.image"
    class="module-media"
    :src="urlFor(media.image, { w: 2400 })"
    :alt="media.image.alt || ''"
  />
</template>

<script setup>
/**
 * The media half of the big-image home modules: an image, or an uploaded
 * video playing as a silent loop. Renders nothing when the chosen media
 * type's asset is missing, so modules can drop it in unguarded. The parent
 * positions it; cover-fitting is here since every user wants it.
 */
defineProps({
  media: { type: Object, required: true },
})

const urlFor = useSanityImage()
</script>

<style scoped>
.module-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
