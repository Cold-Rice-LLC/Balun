<template>
  <figure
    v-if="module.image"
    class="image-module"
  >
    <img
      :src="urlFor(module.image, { w: 1400 })"
      :alt="module.image.alt || ''"
      loading="lazy"
    />
  </figure>
</template>

<script setup>
/**
 * Info module: a single rounded-corner image — 6 of the page's 12 columns,
 * centered.
 */
defineProps({
  module: { type: Object, required: true },
})

const urlFor = useSanityImage()
</script>

<style scoped>
.image-module {
  grid-column: 4 / span 6;

  & img {
    width: 100%;
    height: auto;
    border-radius: var(--radius-def);
  }
}

@media (max-width: 768px) {
  .image-module {
    grid-column: 1 / -1;
  }
}
</style>
