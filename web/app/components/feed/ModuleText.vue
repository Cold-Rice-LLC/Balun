<template>
  <div
    v-if="module.body?.length"
    class="feed-module text-module rich-text font-secondary normal-case"
  >
    <RichText :value="module.body" />
  </div>
</template>

<script setup>
/**
 * Feed detail module: rich text in the panel's category text color.
 */
defineProps({
  module: { type: Object, required: true },
})
</script>

<style scoped>
.text-module {
  max-width: 64rem;

  :deep(h2),
  :deep(h3) {
    text-transform: uppercase;
    margin-top: var(--spacing-base);
  }

  :deep(a) {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
}
</style>
