<template>
  <header class="fixed top-0 left-0 w-full grid grid-cols-3 p-base">
    <div class="col-start-2 flex justify-center items-center">
      <NuxtLink
        :to="localePath('/')"
        class="home-link text-grey-3"
      >
        <span class="sr-only">Balun</span>

        <IconsLogo />
      </NuxtLink>
    </div>

    <nav class="flex justify-end items-start lg:items-center">
      <ul class="text-base lg:text-xs flex gap-x-xs">
        <li>
          <NuxtLink
            :to="localePath('/feed')"
            class="bg-yellow text-grey-6"
            >{{ $t('nav.feed') }}</NuxtLink
          >
        </li>

        <li>
          <NuxtLink
            :to="localePath('/info')"
            class="bg-purple text-white"
            >{{ $t('nav.info') }}</NuxtLink
          >
        </li>
      </ul>
    </nav>

    <!-- The live tab, only while the stream is on: hangs off the right edge
         below the nav pills, reading sideways. -->
    <NuxtLink
      v-if="live?.isLive"
      :to="localePath('/live')"
      class="live-link"
    >
      <IconsRing />
      <span>{{ live.location || $t('feed.live') }}</span>
    </NuxtLink>
  </header>
</template>

<script setup>
import { liveStatusQuery } from '~/utils/queries'

// Internal links carry the /{lang}-{country} prefix of the active locale.
const localePath = useLocalePath()

// Live state for the tab: from Site Settings (Mux's webhook flips it), with
// this market's location label. The shell is cached, so it re-checks every
// 60s — a stream starting shows up site-wide without a reload.
const market = useMarket()
const sanity = useSanity()
const { data: live, refresh } = await useAsyncData(
  () => `live-status-${market.value.market}-${market.value.lang}`,
  () => sanity.fetch(liveStatusQuery, { market: market.value.market, lang: market.value.lang }),
  { watch: [() => market.value.market, () => market.value.lang] },
)
useIntervalFn(refresh, 60_000)
</script>

<style scoped>
header {
  z-index: 5000;
}

.home-link {
  svg {
    width: 5.5rem;
  }
}

nav {
  a {
    padding: var(--spacing-xs) 1.5rem;
    border-radius: calc(infinity * 1px);

    @media (min-width: 768px) {
      padding: var(--spacing-xs) var(--spacing-sm);
    }
  }
}

.live-link {
  position: absolute;
  right: 0;
  top: 7.7rem;
  background-color: var(--color-grey-1);
  padding: var(--spacing-base) var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  writing-mode: sideways-lr;
  height: max-content;
  color: var(--color-red);
  border-top-left-radius: var(--radius-def);
  border-bottom-left-radius: var(--radius-def);
  line-height: 1;
  font-size: var(--text-sm);

  & > * {
    flex: none;
  }
}

.live-link :deep(.icon-ring) {
  width: 1.1rem;
  animation: live-blink 1.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

/* Recording-light pulse: never fully out, so the tab still reads as live
   between blinks. */
@keyframes live-blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.15;
  }
}
</style>
