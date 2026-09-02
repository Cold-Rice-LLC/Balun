<template>
  <section
    v-if="module.body"
    class="prose-module"
  >
    <RichText
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
        // Wide enough for the full-width mobile rendering on high-DPI
        // screens; desktop only draws it at inline-word size.
        src: urlFor(value, { w: 1000 }),
        alt: value.alt || '',
        class: 'prose-image',
        loading: 'lazy',
        // Intrinsic dimensions so the browser reserves the right width
        // before the file loads (no text reflow).
        ...sanityImageDimensions(value),
      }),
  },
}
</script>

<style scoped>
.prose-module {
  grid-column: 1 / -1;
  color: var(--color-purple);
  /* Placeholder mobile scale until there's a spec for small screens. */
  font-size: 4rem;
  line-height: 0.84;
  padding-right: 2rem;

  @media (min-width: 768px) {
    font-size: 9.4vw;
    padding-right: 4rem;
  }
}

/* Serializer-rendered nodes carry no scope attr — flat :deep, never nested
   (the compiler emits broken selectors otherwise). */
.prose-module :deep(.prose-image) {
  /* Mobile: a full-width block that breaks the text either side of it. */
  display: block;
  width: 100%;
  height: auto;
  margin-block: 1rem;

  @media (min-width: 768px) {
    /* Back into the flow between words — 1.5x the font's x-height (the ex
       unit IS the x-height), aspect kept by the auto width. */
    display: inline-block;
    width: auto;
    height: 1.5ex;
    margin-block: 0;
    vertical-align: middle;
  }
}
</style>
