<template>
  <!-- Falls back to the stub until real (i18n) content exists — a pre-migration
       plain-string title resolves to null in the query. -->
  <article
    v-if="page?.title || page?.body"
    class="info-page px-base"
  >
    <h1 class="uppercase text-lg">{{ page.title }}</h1>

    <div
      v-if="page.body"
      class="info-body space-y-base"
    >
      <SanityContent :blocks="page.body" />
    </div>
  </article>

  <div
    v-else
    class="h-svh flex justify-center items-center"
  >
    <h1>Info</h1>
  </div>
</template>

<script setup>
import { infoQuery } from '~/utils/queries'

// Info content is translated: keyed by language so each caches separately and
// switching language refetches in place.
const market = useMarket()
const sanity = useSanity()
const { data: page } = await useAsyncData(
  () => `info-${market.value.lang}`,
  () => sanity.fetch(infoQuery, { lang: market.value.lang }),
  { watch: [() => market.value.lang] },
)
</script>

<style scoped>
.info-page {
  padding-top: calc(var(--spacing-button-lg-height) + var(--spacing-base) * 2);
  padding-bottom: var(--spacing-base);
  max-width: 48rem;
}

.info-body {
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
