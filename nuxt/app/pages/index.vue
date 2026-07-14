<template>
  <div class="home-page px-base">
    <template v-if="modules.length">
      <component
        :is="moduleComponents[m._type]"
        v-for="m in modules"
        :key="m._key"
        :module="m"
        :live-by-gid="liveByGid"
      />
    </template>

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

// $market selects the market's home page or the default; $lang resolves the
// translated fields inside it (tagline). Keyed by both so each combo caches
// its own shell and switching either refetches in place.
const sanity = useSanity()
const market = useMarket()
const { data: home } = await useAsyncData(
  () => `home-${market.value.market}-${market.value.lang}`,
  () => sanity.fetch(homeQuery, { market: market.value.market, lang: market.value.lang }),
  { watch: [() => market.value.market, () => market.value.lang] },
)

// String names don't resolve components in dynamic :is at runtime.
const moduleComponents = {
  moduleProductGrid: resolveComponent('HomeProductGrid'),
  moduleFeaturedProduct: resolveComponent('HomeFeaturedProduct'),
}

const modules = computed(() => home.value?.modules ?? [])

// Every product gid referenced by any module (grid arrays + featured singles),
// fetched live in one batch so the cached shell stays geo-agnostic.
const gids = computed(() => {
  const out = []
  for (const m of modules.value) {
    if (m._type === 'moduleProductGrid') out.push(...(m.products ?? []).map((p) => p.gid))
    else if (m._type === 'moduleFeaturedProduct' && m.product) out.push(m.product.gid)
  }
  return out.filter(Boolean)
})

const { data: liveData } = useShopifyProducts(gids)

// gid → live product, so each module resolves its cards' price/availability.
const liveByGid = computed(() => {
  const map = {}
  for (const p of liveData.value?.products ?? []) {
    if (p?.id) map[p.id] = p
  }
  return map
})
</script>

<style scoped>
.home-page {
  padding-top: calc(var(--spacing-button-lg-height) + var(--spacing-base) * 2);
  padding-bottom: var(--spacing-base);
}
</style>
