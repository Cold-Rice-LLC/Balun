<template>
  <article class="legal-page px-base">
    <h1 class="uppercase text-lg">{{ page.title }}</h1>

    <div
      v-if="page.body"
      class="body-copy mt-base space-y-base text-grey-4 [&_h2]:text-grey-1"
    >
      <RichText :value="page.body" />
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

// Keyed by slug + market + language: $market selects the market's page for
// this slug or the default, $lang resolves the translated fields inside it —
// each combo caches separately and switching any refetches in place.
const { data: page } = await useAsyncData(
  () => `legal-${slug.value}-${market.value.market}-${market.value.lang}`,
  () =>
    sanity.fetch(legalPageQuery, {
      slug: slug.value,
      market: market.value.market,
      lang: market.value.lang,
    }),
  { watch: [slug, () => market.value.market, () => market.value.lang] },
)

useNotFound(page, 'Page not found')
</script>

<style scoped>
.legal-page {
  padding-top: var(--spacing-page-top);
  padding-bottom: var(--spacing-base);
  max-width: var(--container-measure);
}
</style>
