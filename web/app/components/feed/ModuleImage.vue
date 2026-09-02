<template>
  <figure
    v-if="module.image"
    class="feed-module"
  >
    <img
      :src="urlFor(module.image, { w: 1600 })"
      :alt="module.image.alt || ''"
      class="w-full rounded-def"
      loading="lazy"
      v-bind="sanityImageDimensions(module.image)"
    />
  </figure>
</template>

<script setup>
/**
 * Feed detail module: a single image at the panel's full width, at its own
 * aspect ratio.
 */
defineProps({
  module: { type: Object, required: true },
})

const urlFor = useSanityImage()
</script>
