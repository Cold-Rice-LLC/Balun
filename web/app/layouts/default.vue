<template>
  <!-- First tab stop on every page: parked above the viewport, slides into
       view only while focused, so sighted keyboard users can jump the fixed
       header and bottom nav. Above --z-nav so the header never covers it. -->
  <a
    href="#main"
    class="fixed top-0 left-0 z-(--z-modal) px-sm py-xs bg-grey-1 text-grey-7 -translate-y-full focus-visible:translate-y-0"
    >{{ $t('nav.skip') }}</a
  >

  <MainNav :inert="modalOpen" />
  <SecondaryNav :inert="modalOpen" />

  <main id="main">
    <slot />
  </main>

  <MainFooter :inert="modalOpen" />
</template>

<script setup>
// The feed detail is a modal route over the feed landing (the landing makes
// itself inert in pages/feed.vue); the chrome goes inert with it, so focus
// and screen readers can't wander behind the dialog. Route names carry the
// i18n locale suffix (feed-slug___en-us).
const route = useRoute()
const modalOpen = computed(() => /^feed-slug___/.test(String(route.name ?? '')))
</script>
