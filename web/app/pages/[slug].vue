<template>
  <!-- Title small and centered up top; the text a centered half-width
       column from 768px (full width on phones). -->
  <article class="pt-page-top pb-lg px-base">
    <h1 class="text-sm uppercase text-center">{{ page.title }}</h1>

    <div
      v-if="page.body"
      class="body-copy mt-md mx-auto md:w-1/2 space-y-base font-secondary text-grey-6 [&_h2]:text-black"
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
