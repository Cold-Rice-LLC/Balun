<template>
  <SanityContent
    :value="value"
    :components="merged"
  />
</template>

<script setup>
/**
 * The house rich text renderer: SanityContent with the link mark overridden
 * to behave exactly like AppLink — an internal link resolves its referenced
 * document through internalLinkPath and renders as <NuxtLink> with the
 * locale prefix, an external URL opens in a new tab, mailto:/tel: pass
 * through, and a link whose target no longer resolves falls back to plain
 * text rather than shipping a dead anchor. Extra serializers (e.g. the info
 * prose module's inline images) merge in via `components`. Renders a
 * rootless fragment, like SanityContent.
 */
import { h } from 'vue'
import { NuxtLink } from '#components'

const props = defineProps({
  value: { type: [Array, Object], default: () => [] },
  components: { type: Object, default: () => ({}) },
})

const { locale } = useI18n()

// mailto:/tel: are same-tab; everything else external opens a new tab.
const externalLink = (url, slots) =>
  /^(mailto:|tel:)/i.test(url)
    ? h('a', { href: url }, slots.default?.())
    : h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, slots.default?.())

const link = (mark, { slots }) => {
  const value = mark.value ?? {}
  if (value.linkType === 'internal') {
    const path = internalLinkPath(value.internal)
    return path ? h(NuxtLink, { to: `/${locale.value}${path}` }, () => slots.default?.()) : slots.default?.()
  }
  return value.externalUrl ? externalLink(value.externalUrl, slots) : slots.default?.()
}

const merged = computed(() => ({
  ...props.components,
  marks: { link, ...props.components.marks },
}))
</script>
