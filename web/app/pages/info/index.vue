<template>
  <!-- Modular render; falls back to the legacy single-body layout until the
       modules are populated, then to the stub if neither exists. -->
  <article
    v-if="modules.length"
    class="info-page px-base enter-in-fade-up"
    :class="{ 'leads-prose': leadsProse }"
  >
    <!-- Shoe outlines overlaid on the content block: absolute over the
         article's full box, so it scrolls with the page. width/height 100%
         + slice = the SVG crops like background-size: cover on that area. -->
    <div
      class="shoe-overlay"
      aria-hidden="true"
    >
      <IconsShoeOutlines preserveAspectRatio="xMidYMid slice" />
    </div>
    <component
      :is="moduleComponents[m._type]"
      v-for="m in modules"
      :key="m._key"
      :module="m"
    />
  </article>

  <article
    v-else-if="page?.title || page?.body"
    class="info-legacy px-base enter-in-fade-up"
  >
    <h1 class="uppercase text-lg">{{ page.title }}</h1>

    <div
      v-if="page.body"
      class="info-body space-y-base"
    >
      <RichText :value="page.body" />
    </div>
  </article>

  <div
    v-else
    class="h-svh flex justify-center items-center enter-in-fade-up"
  >
    <h1>Info</h1>
  </div>
</template>

<script setup>
import { infoQuery } from '~/utils/queries'

// $market selects the market's info page or the default; $lang resolves the
// translated fields inside it. Keyed by both so each combo caches its own
// shell and switching either refetches in place.
const market = useMarket()
const sanity = useSanity()
const { data: page } = await useAsyncData(
  () => `info-${market.value.market}-${market.value.lang}`,
  () => sanity.fetch(infoQuery, { market: market.value.market, lang: market.value.lang }),
  { watch: [() => market.value.market, () => market.value.lang] },
)

// String names don't resolve components in dynamic :is at runtime.
const moduleComponents = {
  moduleInfoText: resolveComponent('InfoText'),
  moduleInfoImage: resolveComponent('InfoImage'),
  moduleInfoProse: resolveComponent('InfoProse'),
  moduleVideo: resolveComponent('HomeVideo'),
}

// Filtered to known types so a module added in the Studio before its
// component ships doesn't crash the dynamic :is with undefined.
const modules = computed(() => (page.value?.modules ?? []).filter((m) => m._type in moduleComponents))

// The prose module leads with huge display type whose own line box carries
// visual space — the page top tightens when it comes first.
const leadsProse = computed(() => modules.value[0]?._type === 'moduleInfoProse')

useHead({
  // Schema title is tab/SEO only — the modular page renders no heading.
  title: () => `${page.value?.title || t('meta.info')} — Balun`,
  bodyAttrs: { class: 'template-info' },
})
</script>

<style scoped>
.shoe-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  /* Decor only — clicks and scroll pass through to the page. */
  pointer-events: none;
  opacity: 0.7;
}

/* Child component root node, so plain scoped descendant selection reaches it. */
.shoe-overlay .icon-shoe-outlines {
  display: block;
  width: 100%;
  height: 100%;
}

/* The page IS the 12-col grid — each module component places itself via
   grid-column on its own root (text 5/4, image 4/6, prose full). relative
   anchors the absolute shoe overlay to this box. align-content centers the
   rows as a block when the content is shorter than the viewport; taller
   content just grows the container past min-height and flows normally. */
.info-page {
  position: relative;
  padding: 14rem var(--spacing-base);
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: var(--spacing-base);
  row-gap: 7rem;
  align-items: start;
  align-content: center;
  min-height: 100svh;
}

/* Display type leading the page brings its own headroom — tuck the top
   padding in. Other first modules keep the standard page top above. */
.info-page.leads-prose {
  padding-top: 10rem;

  @media (min-width: 768px) {
    padding-top: var(--spacing-base);
  }
}

.info-legacy {
  padding-top: var(--spacing-page-top);
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
