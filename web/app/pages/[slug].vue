<template>
  <!-- Half again the usual headroom above the title; the title centered and
       a step above the body's headings; the text a centered column, half the
       page wide but never under 390px (or the screen, on phones) nor
       over 520px. -->
  <article class="pt-[calc(var(--spacing-page-top)*1.5)] pb-lg px-base text-black">
    <h1 class="text-base-plus uppercase text-center">{{ page.title }}</h1>

    <div
      v-if="page.body"
      class="legal-body body-copy mt-md mx-auto w-1/2 min-w-[min(39rem,100%)] max-w-[52rem] space-y-base font-secondary"
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

useSeo(() => ({ seo: page.value?.seo, title: page.value?.title }))
</script>

<style scoped>
/* Three quarters more room above each heading than the shared body copy
   gives. */
.legal-body :deep(h2) {
  margin-top: calc(var(--spacing-base) * 1.75);
}
</style>
