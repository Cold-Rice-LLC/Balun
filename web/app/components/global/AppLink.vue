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
    v-else-if="to"
    :to="to"
  >
    <slot>{{ link.label }}</slot>
  </NuxtLink>

  <span v-else>
    <slot>{{ link.label }}</slot>
  </span>
</template>

<script setup>
/**
 * Renders a Sanity link (navLink, labeledLink, or a bare linkTarget): an
 * external URL opens in a new tab as an <a>; an internal link renders as a
 * <NuxtLink> to the referenced document's route (see internalLinkPath),
 * carrying the active locale prefix. An internal link that resolves to
 * nothing — an unpublished target — falls back to plain text, so a dead
 * anchor never ships.
 *
 * The prefix is applied by hand rather than via localePath(): under the
 * 'prefix' strategy both produce identical URLs, and localePath() logs a
 * router warning for paths with no route yet (e.g. a legal page pre-launch).
 */
const props = defineProps({
  link: {
    type: Object,
    required: true,
  },
})

const { locale } = useI18n()

const to = computed(() => {
  const path = internalLinkPath(props.link.internal)
  return path ? `/${locale.value}${path}` : null
})
</script>
