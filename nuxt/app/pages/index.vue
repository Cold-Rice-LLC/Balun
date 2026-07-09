<template>
  <div class="home-page px-base">
    <section
      v-if="featured.length"
      class="featured"
    >
      <h2 class="uppercase text-xs section-heading">Featured</h2>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-base">
        <ProductCard
          v-for="item in featured"
          :key="item.doc._id"
          :doc="item.doc"
          :live="item.live"
        />
      </div>
    </section>

    <div
      v-else
      class="h-svh flex justify-center items-center"
    >
      <h1>Home</h1>
    </div>
  </div>
</template>

<script setup>
import { homeQuery } from '~/utils/queries'

const { data: home } = await useSanityQuery(homeQuery)

const docs = computed(() => home.value?.featuredProducts ?? [])
const gids = computed(() => docs.value.map((doc) => doc.gid).filter(Boolean))

// Live data hydrates client-side so the cached HTML shell stays geo-agnostic.
const { data: liveData } = useShopifyProducts(gids)

const featured = computed(() =>
  docs.value.map((doc) => ({
    doc,
    live: liveData.value?.products?.find((p) => p?.id === doc.gid) ?? null,
  })),
)
</script>

<style scoped>
.home-page {
  padding-top: calc(var(--spacing-button-lg-height) + var(--spacing-base) * 2);
  padding-bottom: var(--spacing-base);
}

.section-heading {
  color: var(--color-grey-4);
  margin-bottom: var(--spacing-base);
}
</style>
