<template>
  <section
    ref="moduleEl"
    class="featured-product text-grey-6"
  >
    <header
      v-if="module.heading || module.subheading"
      class="flex flex-col items-center gap-sm text-center"
    >
      <h2
        v-if="module.heading"
        class="heading text-xl leading-none"
      >
        {{ module.heading }}
        <span class="heading-highlight">
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
        mobile-nav-below
      />
    </div>

    <!-- Teleported: the home page's entrance animation leaves a transform on
         its wrapper, and a transformed ancestor becomes the containing block
         for position:fixed — which pinned these to the bottom of the page
         instead of the viewport. Out here they fix to the viewport again.
         Must stay the only body teleport — LocaleModal explains why. -->
    <Teleport to="body">
      <div
        v-if="product"
        class="ctas"
        :class="{ 'is-visible': ctasVisible && !quickAddOpen }"
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

// The CTAs are position:fixed and fade with the module's visibility. 0.75:
// fade out as soon as a quarter of the module has scrolled away — and since
// modules are 100svh, two featured modules can never both pass the threshold
// and stack their CTAs in the same fixed slot.
const moduleEl = ref(null)
const ctasVisible = useInView(moduleEl, { threshold: 0.75 })

// ...and drop out of the way once the drawer they opened is up. Destructured
// so the template unwraps the ref — reaching through the returned object
// (quickAdd.isOpen) yields the Ref itself, which is always truthy.
const { isOpen: quickAddOpen } = useQuickAdd()
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

.heading {
  position: relative;

  .heading-highlight {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 0.8em;
    background-color: var(--color-yellow);
    z-index: -1;
    border-top-left-radius: 0.15em;
    border-bottom-left-radius: 0.15em;
    border-bottom-right-radius: 0.15em;

    .bump {
      position: absolute;
      top: 0;
      right: 0;
      transform: translateX(100%);
      height: 0.45em;
      width: 0.45em;
      background-color: var(--color-yellow);
      border-bottom-right-radius: 0.15em;
      border-top-right-radius: 0.15em;

      &::after {
        --fillet: 0.15em;

        content: '';
        position: absolute;
        top: 100%;
        left: 0;
        width: var(--fillet);
        height: var(--fillet);
        background: radial-gradient(
          circle at 100% 100%,
          transparent calc(var(--fillet) - 0.5px),
          var(--color-yellow) var(--fillet)
        );
        pointer-events: none;
      }
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
   overlay backdrops (z 4800) so an open drawer blurs them like the rest of
   the page. */
.ctas {
  position: fixed;
  z-index: 4000;
  bottom: calc(var(--spacing-button-md-height) + var(--spacing-base));
  /* Full width on mobile; from 768px up, the quick-add drawer's left column. */
  inset-inline: var(--spacing-base);
  display: grid;
  /* Quick add alone on mobile; learn more joins from 768px up. */
  grid-template-columns: 1fr;
  gap: var(--spacing-base);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  /* transition-delay: 0s; */

  @media (min-width: 768px) {
    bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
  }

  &.is-visible {
    opacity: 1;
    pointer-events: auto;
    /* transition-delay: 0.3s; */
  }

  /* Both CTAs share the pill look; extra specificity so the quick-add
     trigger's own default (circle "+") styles lose. */
  .cta {
    width: 100%;
    height: var(--spacing-button-lg-height);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-def);
    transition:
      background-color 0.3s,
      color 0.3s;
  }

  .cta-quick-add {
    background-color: var(--color-grey-7);
    color: var(--color-white);

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
