<template>
  <ul
    v-if="links.length"
    class="feed-module links flex flex-wrap gap-sm"
  >
    <li
      v-for="item in links"
      :key="item._key"
    >
      <AppLink
        :link="item"
        class="button text-lg bg-black text-grey-1 rounded-lg leading-none px-4 py-2 uppercase"
      >
        {{ item.label }}
      </AppLink>
    </li>
  </ul>
</template>

<script setup>
/**
 * Feed detail module: a row of button-style links (labeledLink items — the
 * label and destination are flat on each), in the card's RSVP button look.
 */
const props = defineProps({
  module: { type: Object, required: true },
})

const links = computed(() => props.module.links ?? [])
</script>

<style scoped>
.button {
  display: inline-block;
}
</style>
