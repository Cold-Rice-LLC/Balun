<template>
  <!-- One window-high stage in the page flow (the footer follows it): the
       stream plays in it (the Mux player edge to edge, or a YouTube embed
       centered at the video module's size; black until live — see
       docs/live-streaming.md for how `isLive` flips), and the editorial
       corner sticks to its bottom edge. -->
  <div class="stage">
    <LivePlayer
      v-if="stream?.type === 'mux'"
      :playback-id="stream.playbackId"
    />

    <LiveYouTube
      v-else-if="stream?.type === 'youtube'"
      :video-id="stream.videoId"
    />

    <!-- Blurs the stream while the featured product is open, and closes it
         on click — the quick-add drawer's backdrop. It lives here rather
         than in the component because it has to sit above the stream and
         below the whole corner. -->
    <button
      v-if="featuredOpen"
      class="backdrop enter-in-fade"
      @click="featuredOpen = false"
    >
      <span class="sr-only">{{ $t('live.closeFeatured') }}</span>
    </button>

    <!-- Bottom-left. Live: the location label + description, with the
         featured product below — its panels open in place, pushing the
         text up. Offline: the note and a way to the shop. -->
    <div class="corner enter-in-fade-up">
      <template v-if="page?.isLive">
        <div
          v-if="page.location || page.description"
          class="intro font-secondary text-base leading-[1.2]"
        >
          <p class="uppercase">{{ page.location }}</p>
          <p>{{ page.description }}</p>
        </div>

        <LiveFeaturedProduct
          v-if="page.featuredProduct?.slug"
          v-model:open="featuredOpen"
          :product="page.featuredProduct"
        />
      </template>

      <template v-else>
        <p class="font-secondary text-base uppercase leading-[1.2]">{{ $t('live.offline') }}</p>

        <NuxtLink
          :to="localePath('/')"
          class="pill-button text-base-plus"
        >
          {{ $t('nav.shop') }}
        </NuxtLink>
      </template>
    </div>
  </div>
</template>

<script setup>
import { liveQuery } from '~/utils/queries'

/**
 * The Live page: the stream as a full-page stage, and the corner bottom-left
 * — while live, the location label, description, and the featured product
 * (image + variant picker, opened in place over a backdrop that blurs the
 * stream); offline, the note and a shop link. Live state and the source
 * (Mux or YouTube) come from Site Settings — with Mux, flipped by its
 * webhook — re-checked every 30s while open so someone waiting sees the
 * stream start without reloading. Market-scoped like home: this market's
 * page if it exists, else the default.
 */
const { t } = useI18n()
const localePath = useLocalePath()
const market = useMarket()
const sanity = useSanity()
const { data: page, refresh } = await useAsyncData(
  () => `live-${market.value.market}-${market.value.lang}`,
  () => sanity.fetch(liveQuery, { market: market.value.market, lang: market.value.lang }),
  { watch: [() => market.value.market, () => market.value.lang] },
)
useIntervalFn(refresh, 30_000)

const featuredOpen = ref(false)

// What the stage plays: nothing unless Live Now is on, then whichever source
// Site Settings names — and only once that source is actually filled in, so
// a half-set-up stream leaves the offline state up rather than a dead frame.
const stream = computed(() => {
  if (!page.value?.isLive) return null
  if (page.value.liveSource === 'youtube') {
    const videoId = youtubeId(page.value.youtubeUrl)
    return videoId ? { type: 'youtube', videoId } : null
  }
  return page.value.muxPlaybackId ? { type: 'mux', playbackId: page.value.muxPlaybackId } : null
})

useHead({
  title: () => `${t('meta.live')} — Balun`,
  bodyAttrs: { class: 'template-live' },
})
</script>

<style scoped>
/* Window-high, full width, in flow: scrolls away with the page so it never
   sits over the footer. The player/offline note fill it; the corner is its
   flex-end child. */
.stage {
  position: relative;
  height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-color: var(--color-black);
}

.stage :deep(.live-player) {
  position: absolute;
  inset: 0;
  aspect-ratio: auto;
  border-radius: 0;
}

/* The YouTube embed keeps its own geometry instead — the video module's size,
   centered in the stage. That module sits in a base-padded container and takes
   55% of it from 768px, so the widths here are measured inside that padding
   too, and the two come out identical. */
.stage :deep(.live-youtube) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - var(--spacing-base) * 2);

  @media (min-width: 768px) {
    width: calc((100% - var(--spacing-base) * 2) * 0.55);
  }
}

/* Over the stream, under the corner. Absolute rather than fixed so it covers
   exactly the stage and scrolls away with it; the navs are fixed at z 5000
   and stay crisp, as they do behind the quick-add drawer. enter-in-fade
   fades it up on mount — the panels vanish outright on close, so it goes
   with them rather than lingering through a leave transition. */
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(6px);
  cursor: pointer;
}

/* Sticks above the secondary nav while the stage is on screen, and — being
   sticky, not fixed — stops at the stage's bottom edge, so scrolling the
   footer in carries it up with the stage. Quick-add-drawer width: full on
   mobile, a quarter of the window from 768px. Capped to the window; the
   featured product's panels scroll within themselves past that (no
   overflow here — it would clip the image panel's tab, which hangs outside
   its box). */
.corner {
  position: sticky;
  z-index: 2;
  bottom: calc(var(--spacing-button-md-height) + var(--spacing-base));
  margin: 0 var(--spacing-base) calc(var(--spacing-button-md-height) + var(--spacing-base));
  max-height: calc(100svh - var(--spacing-button-md-height) - var(--spacing-page-top));
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  color: var(--color-grey-1);

  @media (min-width: 768px) {
    width: calc(25vw - var(--spacing-base) * 0.75);
    bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
    margin-bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
    max-height: calc(100svh - var(--spacing-button-lg-height) - var(--spacing-page-top));
  }
}

/* Label left, description right, per the mockup. */
.intro {
  flex: none;
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: var(--spacing-base);
}
</style>
