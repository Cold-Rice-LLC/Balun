<template>
  <section
    ref="moduleEl"
    class="featured-product text-grey-6"
  >
    <header
      v-if="module.heading || module.subheading"
      class="flex flex-col items-center gap-base text-center"
    >
      <h2
        v-if="module.heading"
        class="heading text-xl"
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
      />
    </div>

    <p
      v-if="module.caption"
      class="caption font-secondary uppercase text-center py-sm"
    >
      {{ module.caption }}
    </p>

    <!-- Teleported: the home page's entrance animation leaves a transform on
         its wrapper, and a transformed ancestor becomes the containing block
         for position:fixed — which pinned these to the bottom of the page
         instead of the viewport. Out here they fix to the viewport again. -->
    <Teleport to="body">
      <div
        v-if="product"
        class="ctas"
        :class="{ 'is-visible': ctasVisible }"
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
 * caption, and quick add / learn more CTAs. `module.product` is the Sanity
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

// The CTAs are position:fixed and fade with the module's visibility. 0.5:
// show only while the module holds the MAJORITY of the viewport — modules
// are 100svh, so two featured modules can never both pass the threshold
// and stack their CTAs in the same fixed slot.
const moduleEl = ref(null)
const ctasVisible = useInView(moduleEl, { threshold: 0.5 })
</script>

<style scoped>
/* The module fills the viewport below the page's top padding: header up
   top, caption below, the carousel absorbing the leftover space. A HARD
   height, not min-height — a flex container with min-height grows to fit
   its content, so the carousel's "leftover" would just be the image's
   intrinsic size and the frames would never cap to the fold. */
.featured-product {
  height: calc(100svh - var(--spacing-page-top));
  display: flex;
  flex-direction: column;
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
  /* Absorb whatever the header/caption leaves of the module height;
     min-height 0 lets it SHRINK below content size so the shared
     carousel's frames cap to it. */
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
  bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
  left: var(--spacing-base);
  width: calc(50vw - (var(--spacing-base) * 1.5));
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-base);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;

  &.is-visible {
    opacity: 1;
    pointer-events: auto;
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
    background-color: var(--color-grey-2);
    color: var(--color-grey-6);

    &:hover {
      color: var(--color-grey-7);
    }
  }
}

@media (max-width: 768px) {
  .ctas {
    right: var(--spacing-base);
    width: auto;
  }
}
</style>
