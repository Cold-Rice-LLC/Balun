<template>
  <!-- Modular render; a stub until the modules are populated. -->
  <article
    v-if="modules.length"
    class="info-page enter-in-fade-up"
    :class="{ 'leads-prose': leadsProse }"
  >
    <!-- The modules carry no heading of their own; the page title is tab and
         SEO copy (see useSeo), so it heads the outline invisibly. -->
    <h1 class="sr-only">{{ page?.title || $t('meta.info') }}</h1>

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

  <div
    v-else
    class="h-svh flex justify-center items-center enter-in-fade-up"
  >
    <h1>{{ $t('meta.info') }}</h1>
  </div>
</template>

<script setup>
import { infoQuery } from '~/utils/queries'

const { t } = useI18n()
const { data: page } = await useMarketPage('info', infoQuery)

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

// Schema title is tab/SEO only — the modular page renders no heading.
useSeo(() => ({ seo: page.value?.seo, title: page.value?.title || t('meta.info') }))

useHead({
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
  padding: var(--spacing-xl) var(--spacing-gutter);
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
  padding-top: var(--spacing-lg);

  @media (min-width: 768px) {
    padding-top: var(--spacing-base);
  }
}
</style>
