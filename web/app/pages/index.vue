<template>
  <!-- Sibling of .home-page, not a child: enter-in-fade-up animates opacity
  and transform there, which would hide the overlay and re-root its fixed
  positioning. Always in the cached shell; shows itself pre-paint via a head
  script + html class when the intro should play. See the component. -->
  <HomeIntro
    v-if="showIntro"
    @done="showIntro = false"
  />
  <div
    class="home-page enter-in-fade-up"
    :class="{ 'hero-first': heroFirst, 'featured-first': featuredFirst }"
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
  moduleHeadlineOverImage: resolveComponent('HomeHeadlineOverImage'),
  moduleVideo: resolveComponent('HomeVideo'),
}

const modules = computed(() => home.value?.modules ?? [])

// SSR-rendered unconditionally (the shell is edge-cached, so it can't vary);
// the component removes itself on mount when it shouldn't play.
const showIntro = ref(true)

// A full-viewport module in the first slot is a hero: it meets the top of the
// viewport with the fixed header floating over it (big image + logo) or
// centers its content in the full height itself (headline over image). The
// page's top padding exists to clear that header, so here it would only push
// the hero past the fold — drop it. Any other opening module keeps the padding.
const heroFirst = computed(() => ['moduleBigImageLogo', 'moduleHeadlineOverImage'].includes(modules.value[0]?._type))

// On mobile the page opens with extra headroom — except when a featured
// product leads, which wants to meet the header like a hero.
const featuredFirst = computed(() => modules.value[0]?._type === 'moduleFeaturedProduct')

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

  /* Mobile opens with extra headroom unless a featured product leads. */
  /* @media (max-width: 767px) {
    &:not(.featured-first) {
      margin-top: 15rem;
    }
  } */

  &.hero-first {
    padding-top: 0;
  }

  & > section + section {
    margin-top: 12rem;

    @media (min-width: 768px) {
      margin-top: 20rem;
    }
  }

  & > section.featured-product + section.marquee-module {
    margin-top: 3rem;
  }

  & > section.headline-over-image + section {
    margin-top: 15rem;

    @media (min-width: 768px) {
      margin-top: 3rem;
    }
  }

  /* Headline over image joins the contained panels here: it centers its
     content inside 100svh, so its own whitespace already does most of the
     separating. */
  & > section.big-image-logo.is-contained + section,
  & > section.big-image-headline.is-contained + section,
  & > section + section.big-image-logo.is-contained,
  & > section + section.big-image-headline.is-contained {
    margin-top: 10rem;
  }
}
</style>
