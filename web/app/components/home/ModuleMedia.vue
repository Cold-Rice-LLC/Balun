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
      :alt="(mobileImage || media.image).alt || ''"
    />
  </picture>
</template>

<script setup>
/**
 * The media half of the big-image home modules: an image, or an uploaded
 * video playing as a silent loop. Renders nothing when the chosen media
 * type's asset is missing, so modules can drop it in unguarded. The parent
 * positions it; cover-fitting is here since every user wants it.
 *
 * `mobileImage` (optional) swaps in a phone image under 768px — image media
 * only, via <picture>, so each viewport downloads exactly one asset. Video
 * media ignores it (the Studio hides the field there): supporting it would
 * mean a second root and losing the parents' scoped styling of the root.
 */
defineProps({
  media: { type: Object, required: true },
  mobileImage: { type: Object, default: null },
})

const urlFor = useSanityImage()
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
}
</style>
