<template>
  <a
    v-if="link.linkType === 'external'"
    :href="link.externalUrl"
    target="_blank"
    rel="noopener noreferrer"
  >
    <slot>{{ link.label }}</slot>
  </a>

  <NuxtLink
    v-else
    :to="prefixedPath"
  >
    <slot>{{ link.label }}</slot>
  </NuxtLink>
</template>

<script setup>
/**
 * Renders a Sanity `navLink`: an external URL opens in a new tab as an <a>,
 * otherwise an internal path renders as a <NuxtLink> carrying the active
 * locale prefix (editors enter unprefixed paths like /info).
 *
 * Prefix is applied manually rather than via localePath(): editors can enter
 * paths for pages that don't exist yet (e.g. /returns pre-launch), and
 * localePath() logs a router warning on every render for unknown routes.
 * Under the 'prefix' strategy both produce identical URLs.
 */
const props = defineProps({
  link: {
    type: Object,
    required: true,
  },
})

const { locale } = useI18n()

const prefixedPath = computed(() => {
  const path = props.link.internalPath?.startsWith('/')
    ? props.link.internalPath
    : `/${props.link.internalPath ?? ''}`
  return `/${locale.value}${path}`
})
</script>
