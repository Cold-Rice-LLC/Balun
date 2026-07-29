<template>
  <section
    ref="moduleEl"
    class="featured-product text-grey-6"
  >
    <header
      v-if="module.heading || module.subheading"
      class="flex flex-col items-center gap-base text-center py-base"
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
      <button
        v-if="slides.length > 1"
        class="nav nav-prev"
        :aria-label="$t('carousel.prev')"
        @click="swiper?.slidePrev()"
      >
        <IconsPixelArrow />
      </button>

      <Swiper
        class="slides"
        :slides-per-view="1"
        :loop="slides.length > 1"
        :speed="500"
        @swiper="onSwiper"
      >
        <SwiperSlide
          v-for="slide in slides"
          :key="slide._key"
          class="slide"
        >
          <!-- aspect-ratio from the asset's intrinsic dimensions keeps the
               frame hugging the visible image exactly (so highlight %
               coordinates stay true) while max-height caps it to the space
               the 100svh module leaves. -->
          <figure
            class="slide-frame"
            :style="{ aspectRatio: frameRatio(slide) }"
          >
            <img
              :src="urlFor(slide, { w: 1600 })"
              :alt="slide.alt || product?.title || ''"
            />

            <!-- Editor-positioned callouts. x/y are the ANCHOR the leader
                 line points at (% of the image frame — the frame hugs the
                 image, so anchors hold at every viewport size); the text
                 block sits at the frame edge on the chosen side and the
                 line spans the gap. -->
            <p
              v-for="(highlight, i) in slide.highlights ?? []"
              :key="i"
              class="highlight font-secondary uppercase text-2xs"
              :class="highlight.side === 'right' ? 'side-right' : 'side-left'"
              :style="highlightStyle(highlight)"
            >
              <span
                class="hl-text"
                :style="{ maxWidth: highlight.width ? `${highlight.width}vw` : undefined }"
                >{{ highlight.text }}</span
              >
              <span class="hl-line"></span>
              <span class="hl-dot"></span>
            </p>
          </figure>
        </SwiperSlide>
      </Swiper>

      <button
        v-if="slides.length > 1"
        class="nav nav-next"
        :aria-label="$t('carousel.next')"
        @click="swiper?.slideNext()"
      >
        <IconsPixelArrow />
      </button>
    </div>

    <p
      v-if="module.caption"
      class="caption font-secondary uppercase text-center py-sm"
    >
      {{ module.caption }}
    </p>

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
  </section>
</template>

<script setup>
/**
 * Home module: a single product given prominence — heading/subheading, an
 * image carousel with editor-positioned text highlights, caption, and quick
 * add / learn more CTAs. `module.product` is the Sanity editorial doc; live
 * market price/availability comes from `liveByGid` (hydrated client-side by
 * the page) — quick add only renders when the product is live and buyable.
 */
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'

const localePath = useLocalePath()
const urlFor = useSanityImage()

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

// Highlight geometry: the element spans from the image-frame edge to the
// anchor, so the text hugs the edge and the leader line fills the gap.
const highlightStyle = (highlight) => {
  const base = { top: `${highlight.yPosition}%` }
  return highlight.side === 'right'
    ? { ...base, left: `${highlight.xPosition}%`, right: '0' }
    : { ...base, left: '0', width: `${highlight.xPosition}%` }
}

// Swiper instance (from @swiper) drives the arrow buttons; loop mode makes
// prev/next wrap around.
const swiper = ref(null)
const onSwiper = (instance) => {
  swiper.value = instance
}

// Sanity asset refs embed intrinsic dimensions (image-<id>-1600x900-jpg) —
// the frame's CSS aspect-ratio comes from there.
const frameRatio = (slide) => {
  const dims = slide.asset?._ref?.split('-')[2]?.split('x').map(Number)
  return dims?.[0] && dims?.[1] ? `${dims[0]} / ${dims[1]}` : undefined
}
</script>

<style scoped>
/* The module always fills the viewport: header up top, caption/CTAs below,
   and the carousel absorbing (and capped to) the leftover space. */
.featured-product {
  min-height: 100svh;
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
  position: relative;
  /* Absorb whatever the header/caption/CTAs leave of the 100svh; min-height 0
     lets it SHRINK below content size so the frames cap to it. */
  flex: 1;
  min-height: 0;
}

.slides {
  width: 100%;
  height: 100%;
}

.slide {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* The inline aspect-ratio (from the asset's intrinsic dimensions) plus these
   caps yields the largest image box that fits the slide — and because the
   frame always matches the visible image exactly, highlight % positions hold
   at every viewport size. */
.slide-frame {
  position: relative;
  max-width: 100%;
  max-height: 100%;

  img {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.highlight {
  position: absolute;
  margin: 0;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
  color: var(--color-grey-6);

  /* Anchor sits at the far end: text → line → dot. Reversed, the dot leads
     and the text hugs the right edge. */
  &.side-right {
    flex-direction: row-reverse;
  }
}

.hl-text {
  flex: none;
  /* Keep editor line breaks ("GLOSS 01\nWATERPROOF 02" stacks). */
  white-space: pre-line;
}

.hl-line {
  flex: 1;
  height: 1px;
  background-color: currentColor;
  margin-inline: 0.6em;
}

.hl-dot {
  flex: none;
  width: 0.5em;
  height: 0.5em;
  border: 1px solid currentColor;
  border-radius: 50%;
}

.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 3.6rem;
  height: 3.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-grey-5);
  transition: color 0.2s;

  &:hover {
    color: var(--color-grey-7);
  }
}

.nav :deep(.icon-pixel-arrow) {
  width: 2.8rem;
}

.nav-prev {
  left: 0;
}

.nav-next {
  right: 0;
}

/* The icon points left; mirror it for next. */
.nav-next :deep(.icon-pixel-arrow) {
  transform: scaleX(-1);
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
