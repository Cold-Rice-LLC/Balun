<template>
  <div class="feature-carousel">
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
             the parent leaves. -->
        <figure
          class="slide-frame"
          :style="{ aspectRatio: frameRatio(slide) }"
        >
          <img
            :src="urlFor(slide, { w: 1600 })"
            :alt="slide.alt || alt"
          />

          <!-- Editor-positioned callouts. x/y are the ANCHOR the leader
               line points at (% of the image frame — the frame hugs the
               image, so anchors hold at every viewport size); the text sits
               above the far end of the line, at the frame edge on the chosen
               side unless textPosition pulls it in toward the anchor. -->
          <p
            v-for="(highlight, i) in slide.highlights ?? []"
            :key="i"
            class="highlight font-secondary uppercase text-2xs"
            :class="highlight.side === 'right' ? 'side-right' : 'side-left'"
            :style="highlightStyle(highlight)"
          >
            <span
              class="hl-text"
              :style="highlightTextStyle(highlight)"
              >{{ highlight.text }}</span
            >
            <span class="hl-line"></span>
            <IconsStarCircle />
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
</template>

<script setup>
/**
 * The product feature carousel: image slides with editor-positioned leader
 * lines pointing at parts of the product (the product doc's featureCarousel
 * field). Shared by the home Featured Product module and the PDP.
 *
 * Fills its parent — the parent owns the height context (a flex leftover on
 * home, a fixed region on the PDP) and the frames cap to it.
 */
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'

const urlFor = useSanityImage()

defineProps({
  slides: { type: Array, default: () => [] },
  // Fallback alt text when a slide has none (e.g. the product title).
  alt: { type: String, default: '' },
})

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

// The leader's two ends, as insets from the image frame: one end is pinned to
// the anchor (xPosition), the other carries the text. The text end defaults to
// the frame edge, but textPosition pulls it inward toward the anchor.
const leaderInset = (highlight) => {
  const isRight = highlight.side === 'right'
  const textEnd = highlight.textPosition ?? (isRight ? 100 : 0)
  return isRight
    ? { left: highlight.xPosition, right: 100 - textEnd }
    : { left: textEnd, right: 100 - highlight.xPosition }
}

// Highlight geometry: the element spans between those two ends, so the text
// sits at the text end and the leader line fills the gap to the anchor.
const highlightStyle = (highlight) => {
  const { left, right } = leaderInset(highlight)
  return { top: `${highlight.yPosition}%`, left: `${left}%`, right: `${right}%` }
}

// `width` is a max width in % of the IMAGE, but the text's containing block is
// the highlight element — only the leader span wide — so a raw % would measure
// against that instead. Rescale by the span's own share of the image to keep
// the editor's number image-relative (and let text exceed its leader).
const highlightTextStyle = (highlight) => {
  const { left, right } = leaderInset(highlight)
  const span = 100 - left - right
  if (!highlight.width || span <= 0) return undefined
  return { maxWidth: `${(highlight.width / span) * 100}%` }
}
</script>

<style scoped>
.feature-carousel {
  --arrow-width: 8.6rem;

  position: relative;
  width: 100%;
  height: 100%;
}

.slides {
  width: 100%;
  height: 100%;
}

.slide {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Horizontal safe-area: edge gap + arrow + gap on each side. The frame
     caps to the space between the arrows, so highlight text (which hugs the
     frame edge) can never overlap them. */
  padding-inline: calc(var(--arrow-width) + var(--spacing-base) * 2);
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

/* The in-flow row is just line + dot, so it stays dot-height tall and
   translateY(-50%) centers the leader exactly on the anchor; the text is
   absolutely stacked above it. */
.highlight {
  position: absolute;
  margin: 0;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
  color: var(--color-grey-6);

  /* Dot sits at the TEXT end of the line (the frame edge); the line's bare
     end lands on the anchor. side-left reverses the row so the dot leads at
     the left edge; side-right keeps line → dot so the dot sits under the
     right-edge text. */
  &.side-left {
    flex-direction: row-reverse;
  }

  &.side-left .hl-text {
    left: 0;
  }

  &.side-right .hl-text {
    right: 0;
    text-align: right;
  }
}

.highlight :deep(.icon-star-circle) {
  flex: none;
  width: 1em;
}

.hl-text {
  position: absolute;
  bottom: 100%;
  /* max-content, not the default shrink-to-fit: an absolute box would
     otherwise wrap at whatever the leader span happens to be. The editor's
     Max Width (inline, % of the image) is the only thing that wraps it. */
  width: max-content;
  margin-bottom: 0.4em;
  /* Keep editor line breaks ("GLOSS 01\nWATERPROOF 02" stacks). */
  white-space: pre-line;
}

.hl-line {
  flex: 1;
  height: 1px;
  background-color: currentColor;
}

.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: var(--arrow-width);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-grey-1);
  transition: color 0.2s;

  &:hover {
    color: var(--color-grey-3);
  }
}

.nav :deep(.icon-pixel-arrow) {
  width: 100%;
}

.nav-prev {
  left: var(--spacing-base);
}

.nav-next {
  right: var(--spacing-base);
}

/* The icon points left; mirror it for next. */
.nav-next :deep(.icon-pixel-arrow) {
  transform: scaleX(-1);
}
</style>
