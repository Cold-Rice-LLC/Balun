<template>
  <!-- One window-high stage in the page flow (the footer follows it): the
       stream fills it (the Mux player while live; black until then — see
       docs/live-streaming.md for how `isLive` flips), and the editorial
       corner sticks to its bottom edge. -->
  <div class="stage">
    <LivePlayer
      v-if="page?.isLive && page?.muxPlaybackId"
      :playback-id="page.muxPlaybackId"
    />

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
 * (image + variant picker, opened in place); offline, the note and a shop
 * link. Live state comes from Site
 * Settings (flipped by Mux's webhook), re-checked every 30s while open so
 * someone waiting sees the stream start without reloading. Market-scoped
 * like home: this market's page if it exists, else the default.
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

/* Sticks above the secondary nav while the stage is on screen, and — being
   sticky, not fixed — stops at the stage's bottom edge, so scrolling the
   footer in carries it up with the stage. Quick-add-drawer width: full on
   mobile, a quarter of the window from 768px. Capped to the window; the
   featured product's panels scroll within themselves past that (no
   overflow here — it would clip the image panel's tab, which hangs outside
   its box). */
.corner {
  position: sticky;
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
