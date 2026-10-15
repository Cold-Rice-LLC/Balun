<template>
  <section
    ref="moduleEl"
    class="featured-product overflow-x-clip text-grey-6"
  >
    <header
      v-if="module.heading || module.subheading"
      class="flex flex-col items-center gap-sm text-center"
    >
      <h2
        v-if="module.heading"
        class="heading isolate text-xl-minus lg:text-xl leading-none"
      >
        <span class="heading-highlight box-decoration-clone">
          <span class="heading-text">{{ module.heading }}</span>
          <span class="bump"></span>
        </span>
      </h2>

      <p
        v-if="module.subheading"
        class="subline font-secondary uppercase"
      >
        {{ module.subheading }}
      </p>
    </header>

    <div
      v-if="slides.length"
      class="carousel"
    >
      <ProductFeatureCarousel
        :slides="slides"
        :alt="product?.title || ''"
        :eager="isLead"
        :to="product ? localePath(`/products/${product.slug}`) : undefined"
        mobile-nav-below
      />
    </div>

    <!-- Teleported: the home page's entrance animation leaves a transform on
         its wrapper, and a transformed ancestor becomes the containing block
         for position:fixed — which pinned these to the bottom of the page
         instead of the viewport. Out here they fix to the viewport again.
         Client-only so the teleport appends to the end of body at mount:
         SSR-teleported body content lands before the Nuxt root, which made
         these CTAs the page's first tab stops, ahead of the skip link. It
         also keeps this out of the SSR teleport ordering LocaleModal
         explains. Nothing is lost server-side: quick add needs live data
         anyway, and the carousel already links to the product. -->
    <ClientOnly>
      <Teleport to="body">
        <!-- inert while faded out, or the hidden CTAs stay tabbable. -->
        <div
          v-if="product"
          ref="ctasEl"
          class="ctas"
          :class="{ 'is-visible': ctasShown }"
          :inert="!ctasShown"
        >
          <ProductQuickAddTrigger
            class="cta cta-quick-add text-base"
            :doc="product"
            :live="live"
          >
            {{ $t('quickAdd.cta') }}
          </ProductQuickAddTrigger>

          <NuxtLink
            :to="localePath(`/products/${product.slug}`)"
            class="cta cta-learn-more text-base"
          >
            {{ $t('quickAdd.learnMore') }}
          </NuxtLink>
        </div>
      </Teleport>
    </ClientOnly>
  </section>
</template>

<script setup>
/**
 * Home module: a single product given prominence — heading/subheading, the
 * product's feature carousel (ProductFeatureCarousel, shared with the PDP),
 * and quick add / learn more CTAs. `module.product` is the Sanity
 * editorial doc; live market price/availability comes from `liveByGid`
 * (hydrated client-side by the page) — quick add only renders when the
 * product is live and buyable.
 */
const localePath = useLocalePath()

const props = defineProps({
  module: { type: Object, required: true },
  liveByGid: { type: Object, default: () => ({}) },
})

const product = computed(() => props.module.product)
const live = computed(() => props.liveByGid[product.value?.gid] ?? null)
const slides = computed(() => props.module.images ?? [])
const isLead = useIsLeadModule(props.module)

// The CTAs are position:fixed and fade with the module's visibility. 0.75:
// fade out as soon as a quarter of the module has scrolled away — and since
// modules are 100svh, two featured modules can never both pass the threshold
// and stack their CTAs in the same fixed slot.
const moduleEl = ref(null)
const ctasVisible = useInView(moduleEl, { threshold: 0.75 })

// ...and drop out of the way once the drawer they opened is up — revealed,
// not just opened: a cold open holds the drawer through its fetch, and
// hiding (inerting) the focused CTA meanwhile would drop focus to <body>,
// leaving quick add no opener to hand focus back to on close.
const { isOpen: quickAddOpen, pendingOpen: quickAddPending } = useQuickAdd()
const quickAddUp = computed(() => quickAddOpen.value && !quickAddPending.value)

// Keyboard: the teleport parks the CTAs after the footer in the DOM, so
// Tab is routed into them straight after the carousel instead. They show
// while focus is in the module or on them, too — and when Shift+Tab comes
// back to them from below, with the module mostly scrolled away, or
// returns to quick add once the drawer it opened closes.
const ctasEl = ref(null)
const { focused: moduleFocused } = useFocusWithin(moduleEl)
const { focused: ctasFocused } = useFocusWithin(ctasEl)
const revealing = ref(false)
watch(ctasFocused, (focused) => {
  if (focused) revealing.value = false
})
watch(quickAddUp, (up) => {
  if (up && ctasFocused.value) revealing.value = true
})
// And they step aside while keyboard focus is on something else — the next
// module's marquee band, say — that they'd sit on top of. Mouse focus
// (a clicked nav button) doesn't count.
const activeEl = useActiveElement()
const focusElsewhere = computed(() => {
  const el = activeEl.value
  return !!el && el !== document.body && !moduleFocused.value && !ctasFocused.value && el.matches(':focus-visible')
})
const ctasShown = computed(
  () =>
    ((ctasVisible.value && !focusElsewhere.value) || moduleFocused.value || ctasFocused.value || revealing.value) &&
    !quickAddUp.value,
)
useTeleportTabOrder(moduleEl, ctasEl, {
  enabled: computed(() => !quickAddUp.value),
  reveal: () => (revealing.value = true),
})
</script>

<style scoped>
/* The module fills the viewport below the page's top padding: header up
   top, the carousel absorbing the leftover space. A HARD height, not
   min-height — a flex container with min-height grows to fit its content,
   so the carousel's "leftover" would just be the image's intrinsic size
   and the frames would never cap to the fold. */
.featured-product {
  height: calc(65svh - var(--spacing-page-top));
  min-height: 50rem;
  display: flex;
  flex-direction: column;
  padding-bottom: 7.6rem;

  @media (min-width: 768px) {
    height: calc(92svh - var(--spacing-page-top));
    min-height: 60rem;
  }
}

/* Highlighter band behind each line of the heading: an inline background
   with box-decoration-clone, so a wrapped heading gets one rounded
   band per line rather than one block spanning the column. An inline
   background covers the font's content area (1.3em for ABC Maxi Round),
   too tall for a 0.8em band — so the highlight span shrinks its font-size
   to make that content area 0.8em of the heading, and its children scale
   back up by the same factor. The vertical-align pair re-centers the band
   on the line (the smaller content area sits low around the shared
   baseline) without moving the text. */
.heading-highlight {
  --k: calc(0.8 / 1.3);

  position: relative;
  font-size: calc(var(--k) * 1em);
  vertical-align: calc(0.135em / var(--k));
  background-color: var(--color-yellow);
  border-radius: calc(0.15em / var(--k));

  & > * {
    font-size: calc(1em / var(--k));
  }

  .heading-text {
    vertical-align: -0.135em;
  }

  /* Tab off the end of the last line (an absolute child of a wrapped inline
     anchors right/bottom to its last fragment). Tucked one radius under the
     band so it squares off the band's top-right corner, and behind it (the
     heading isolates) so it doesn't paint over the last letter. */
  .bump {
    --radius: 0.15em;

    position: absolute;
    right: 0;
    bottom: 0.35em;
    transform: translateX(calc(100% - var(--radius)));
    height: 0.45em;
    width: calc(0.45em + var(--radius));
    z-index: -1;
    background-color: var(--color-yellow);
    border-bottom-right-radius: var(--radius);
    border-top-right-radius: var(--radius);

    /* Fillet in the inside corner where the tab meets the band's edge. */
    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: var(--radius);
      width: var(--radius);
      height: var(--radius);
      background: radial-gradient(
        circle at 100% 100%,
        transparent calc(var(--radius) - 0.5px),
        var(--color-yellow) var(--radius)
      );
      pointer-events: none;
    }
  }
}

.carousel {
  /* Absorb whatever the header leaves of the module height; min-height 0
     lets it SHRINK below content size so the shared carousel's frames cap
     to it. */
  flex: 1;
  min-height: 0;
}

/* Fixed in the quick-add drawer's slot above the "shop" button, fading with
   the module's visibility (useInView drives .is-visible). Kept below the
   overlay backdrops so an open drawer blurs them like the rest of
   the page. */
.ctas {
  position: fixed;
  z-index: var(--z-floating);
  bottom: calc(var(--spacing-button-md-height) + var(--spacing-base));
  /* Full width on mobile; from 768px up, the quick-add drawer's left column. */
  inset-inline: var(--spacing-gutter);
  display: grid;
  /* Quick add alone on mobile; learn more joins from 768px up. */
  grid-template-columns: 1fr;
  gap: var(--spacing-base);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;

  @media (min-width: 768px) {
    bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
  }

  &.is-visible {
    opacity: 1;
    pointer-events: auto;
  }

  /* Both CTAs share the pill look; extra specificity so the quick-add
     trigger's own default (circle "+") styles lose. */
  .cta {
    width: 100%;
    height: var(--spacing-button-md-height);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-def);
    transition:
      background-color 0.3s,
      color 0.3s;

    /* Filled control: ring inside the fill (see MainNav). */
    &:focus-visible {
      outline-offset: -0.2rem;
    }

    @media (min-width: 768px) {
      height: var(--spacing-button-lg-height);
    }
  }

  .cta-quick-add {
    background-color: var(--color-grey-7);
    color: var(--color-white);

    /* White got lost on the dark fill (as on the info pill). */
    &:focus-visible {
      outline-color: var(--color-yellow);
    }

    &:hover {
      background-color: var(--color-yellow);
      color: var(--color-green);
    }
  }

  .cta-learn-more {
    display: none;
    background-color: var(--color-grey-2);
    color: var(--color-grey-6);

    &:hover {
      color: var(--color-grey-7);
    }

    @media (min-width: 768px) {
      display: flex;
    }
  }

  @media (min-width: 768px) {
    right: auto;
    width: calc(50vw - (var(--spacing-base) * 1.5));
    grid-template-columns: 1fr 1fr;
  }
}
</style>
