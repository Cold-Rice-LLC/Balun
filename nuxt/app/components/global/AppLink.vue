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
    :to="localePath(link.internalPath)"
  >
    <slot>{{ link.label }}</slot>
  </nuxt-link>
</template>

<script setup>
/**
 * Renders a Sanity `navLink`: an external URL opens in a new tab as an <a>,
 * otherwise an internal path renders as a <nuxt-link> carrying the active
 * locale prefix (editors enter unprefixed paths like /info).
 */
defineProps({
  link: {
    type: Object,
    required: true,
  },
})

const localePath = useLocalePath()
</script>
