<template>
  <article class="legal-page px-base">
    <h1 class="uppercase text-lg">{{ page.title }}</h1>

    <div
      v-if="page.body"
      class="legal-body space-y-base"
    >
      <SanityContent :blocks="page.body" />
    </div>
  </article>
</template>

<script setup>
import { legalPageQuery } from '~/utils/queries'

// Top-level slug route for CMS-driven policy pages (Terms, Returns, Privacy).
// Static routes (/, /info, /feed, …) take precedence; this catches the rest and
// 404s cleanly when no legalPage matches.
const route = useRoute()
const slug = computed(() => String(route.params.slug))
const market = useMarket()
const sanity = useSanity()

// Keyed by slug + language: content is translated, so each language caches
// separately and switching language refetches in place.
const { data: page } = await useAsyncData(
  () => `legal-${slug.value}-${market.value.lang}`,
  () => sanity.fetch(legalPageQuery, { slug: slug.value, lang: market.value.lang }),
  { watch: [slug, () => market.value.lang] },
)

// SSR miss.
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}
// Client-side navigation to an unknown slug — setup won't re-run, so guard
// reactively once the in-place refetch resolves to nothing.
watch(page, (value) => {
  if (!value) showError({ statusCode: 404, statusMessage: 'Page not found' })
})
</script>

<style scoped>
.legal-page {
  padding-top: var(--spacing-page-top);
  padding-bottom: var(--spacing-base);
  max-width: 48rem;
}

.legal-body {
  margin-top: var(--spacing-base);
  color: var(--color-grey-4);

  :deep(h2) {
    color: var(--color-grey-1);
    text-transform: uppercase;
    margin-top: var(--spacing-base);
  }

  :deep(a) {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
}
</style>
