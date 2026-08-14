<template>
  <section
    v-if="module.body"
    class="prose-module"
  >
    <SanityContent
      :value="module.body"
      :components="components"
    />
  </section>
</template>

<script setup>
import { h } from 'vue'

/**
 * Info module: full-width purple display text (ABC Maxi Round, inherited
 * from body) with images intermingled INSIDE the flow — proseContent blocks
 * carry inline image children, serialized here as <img> between words.
 */
defineProps({
  module: { type: Object, required: true },
})

const urlFor = useSanityImage()

const components = {
  types: {
    image: ({ value }) =>
      h('img', {
        src: urlFor(value, { w: 600 }),
        alt: value.alt || '',
        class: 'prose-image',
      }),
  },
}
</script>

<style scoped>
.prose-module {
  grid-column: 1 / -1;
  color: var(--color-purple);
  /* Placeholder mobile scale until there's a spec for small screens. */
  font-size: 8rem;
  line-height: 0.84;
  padding-right: 4rem;

  @media (min-width: 768px) {
    font-size: 9.4vw;
  }
}

/* Serializer-rendered nodes carry no scope attr — flat :deep, never nested
   (the compiler emits broken selectors otherwise). */
.prose-module :deep(.prose-image) {
  display: inline-block;
  /* 1.5x the font's x-height (the ex unit IS the x-height), aspect kept by
     the auto width. */
  width: auto;
  height: 1.5ex;
  vertical-align: middle;
}
</style>
