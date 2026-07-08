<template>
  <a
    v-if="link.linkType === 'external'"
    :href="link.externalUrl"
    target="_blank"
    rel="noopener noreferrer"
  >
    <slot>{{ link.label }}</slot>
  </a>

  <nuxt-link
    v-else
    :to="link.internalPath"
  >
    <slot>{{ link.label }}</slot>
  </nuxt-link>
</template>

<script setup>
/**
 * Renders a Sanity `navLink`: an external URL opens in a new tab as an <a>,
 * otherwise an internal path renders as a <nuxt-link>.
 */
defineProps({
  link: {
    type: Object,
    required: true,
  },
})
</script>
