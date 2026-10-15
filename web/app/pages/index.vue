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
    <!-- No visible title: the home page is the site title alone (see useSeo
         below), so the page outline gets the site name. -->
    <h1 class="sr-only">Balun</h1>

    <component
      :is="moduleComponents[m._type]"
      v-for="m in modules"
      :key="m._key"
      :module="m"
      v-bind="productModules.includes(m._type) ? { liveByGid } : {}"
    />
  </div>
</template>

<script setup>
import { homeQuery } from '~/utils/queries'

const { data: home } = await useMarketPage('home', homeQuery)

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

// Only these declare a liveByGid prop; passing it to the rest would fall
// through onto their root as a junk live-by-gid attribute.
const productModules = ['moduleProductGrid', 'moduleFeaturedProduct']

// The opening module's media loads eagerly (see useLeadModule).
provideLeadModule(computed(() => modules.value[0]?._key))

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

// gid → live product, so each module resolves its cards' price/availability.
const liveByGid = useLiveProducts(gids)

// No title of its own: the home page is the site title alone.
useSeo(() => ({ seo: home.value?.seo }))

useHead({
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
    margin-top: var(--spacing-lg);

    @media (min-width: 768px) {
      margin-top: var(--spacing-2xl);
    }
  }

  & > section.featured-product + section.marquee-module {
    margin-top: 3rem;
  }

  & > section.headline-over-image + section {
    margin-top: var(--spacing-xl);

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
    margin-top: var(--spacing-lg);
  }
}
</style>
