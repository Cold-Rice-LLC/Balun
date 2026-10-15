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
 * text rather than shipping a dead anchor. Block-level images get a real
 * serializer too (below). Extra serializers (e.g. the info prose module's
 * inline images) merge in via `components` and win. Renders a rootless
 * fragment, like SanityContent.
 */
import { h } from 'vue'
import { NuxtLink } from '#components'

const props = defineProps({
  value: { type: [Array, Object], default: () => [] },
  components: { type: Object, default: () => ({}) },
})

const { t, locale } = useI18n()
const urlFor = useSanityImage()

// Block-level images (blockContent allows them in product bodies and feed /
// info text modules): the module's default serializer emits an <img> with no
// alt attribute at all. This one carries the editor alt when the field has
// one (empty otherwise), lazy loading, and intrinsic dimensions so the
// column doesn't reflow as it loads.
const image = ({ value }) =>
  h('img', {
    src: urlFor(value, { w: 1000 }),
    alt: value.alt || '',
    loading: 'lazy',
    ...sanityImageDimensions(value),
  })

// mailto:/tel: are same-tab; everything else external opens a new tab, and
// says so for screen readers.
const externalLink = (url, slots) =>
  /^(mailto:|tel:)/i.test(url)
    ? h('a', { href: url }, slots.default?.())
    : h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, [
        slots.default?.(),
        h('span', { class: 'sr-only' }, ` ${t('link.newTab')}`),
      ])

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
  types: { image, ...props.components.types },
  marks: { link, ...props.components.marks },
}))
</script>
