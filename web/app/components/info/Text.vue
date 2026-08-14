<template>
  <section
    v-if="module.text"
    class="text-module font-quaternary uppercase text-center leading-[1.2]"
  >
    {{ module.text }}
  </section>
</template>

<script setup>
/**
 * Info module: a small centered text block — 4 of the page's 12 columns,
 * Monument Grotesk Mono caps in white on the black page. Editor line breaks
 * are kept (pre-line).
 */
defineProps({
  module: { type: Object, required: true },
})
</script>

<style scoped>
.text-module {
  grid-column: 1 / -1;
  color: var(--color-white);
  white-space: pre-line;

  @media (min-width: 768px) {
    grid-column: 5 / span 4;
  }
}
</style>
