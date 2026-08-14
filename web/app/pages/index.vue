<template>
  <div
    class="home-page enter-in-fade-up"
    :class="{ 'hero-first': heroFirst }"
  >
    <component
      :is="moduleComponents[m._type]"
      v-for="m in modules"
      :key="m._key"
      :module="m"
      :live-by-gid="liveByGid"
    />
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
  moduleMarquee: resolveComponent('HomeMarquee'),
  moduleBigImageLogo: resolveComponent('HomeBigImageLogo'),
  moduleBigImageHeadline: resolveComponent('HomeBigImageHeadline'),
}

const modules = computed(() => home.value?.modules ?? [])

// A big-image/logo module in the first slot is a hero: it's built to meet the
// top of the viewport, with the fixed header floating over it and its own
// height already leaving room for the bottom nav. The page's top padding
// exists to clear that header, so here it would only push the hero past the
// fold — drop it. Any other opening module keeps the padding.
const heroFirst = computed(() => modules.value[0]?._type === 'moduleBigImageLogo')

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

// Triggers the fetch (and the on-remount revalidation); rendering reads the
// shared catalog below, so back-navs paint the last known data instantly
// while the refetch lands in the background.
useShopifyProducts(gids)

// gid → live product, so each module resolves its cards' price/availability.
// Sourced from useLiveCatalog rather than the fetch result: fresher surfaces
// (PDP, quick add) feed the same catalog, so a product this visitor just saw
// sell out can't reappear available here.
const { byGid: catalog } = useLiveCatalog()
const liveByGid = computed(() => {
  const map = {}
  for (const gid of gids.value) {
    const live = catalog.value[gid]
    if (live) map[gid] = live
  }
  return map
})

useHead({
  title: () => `Balun`,
  bodyAttrs: { class: 'template-home' },
})
</script>

<style scoped>
.home-page {
  padding-top: var(--spacing-page-top);
  padding-bottom: var(--spacing-base);

  &.hero-first {
    padding-top: 0;
  }

  & > section + section {
    margin-top: 20rem;
  }

  & > section.featured-product + section.marquee-module {
    margin-top: 3rem;
  }

  & > section.big-image-logo.is-contained + section,
  & > section.big-image-headline.is-contained + section,
  & > section + section.big-image-logo.is-contained,
  & > section + section.big-image-headline.is-contained {
    margin-top: 10rem;
  }
}
</style>
