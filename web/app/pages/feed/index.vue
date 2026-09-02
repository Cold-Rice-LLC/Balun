<template>
  <!-- Nothing of its own: the landing is the parent route's (feed.vue). -->
</template>

<script setup>
// The bare /feed child, so the parent's <NuxtPage> has a route to show when
// no post is open. Closing a post navigates here; the landing underneath
// hasn't moved, so the router mustn't scroll it (default: restore a saved
// position, which lands at the top). Arriving from anywhere else keeps the
// normal behavior.
definePageMeta({
  scrollToTop: (to, from) => !from.path.startsWith(`${to.path}/`),
})
</script>
