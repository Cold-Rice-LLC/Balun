<template>
  <header class="fixed top-0 left-0 w-full grid grid-cols-3 py-base px-gutter">
    <!-- High-contrast switch, top left (only while Site Settings has it on). -->
    <ContrastToggle class="self-start lg:self-center" />

    <div class="col-start-2 flex justify-center items-center">
      <NuxtLink
        :to="localePath('/')"
        class="home-link text-grey-3"
      >
        <span class="sr-only">Balun</span>

        <IconsLogo />
      </NuxtLink>
    </div>

    <nav
      class="flex justify-end items-start lg:items-center"
      :aria-label="$t('nav.primary')"
    >
      <ul class="text-sm md:text-base lg:text-xs flex items-center gap-x-xs">
        <!-- The bag opens and closes the cart drawer, same as the bottom
             nav's cart button, but never turns into its checkout. From
             768px: on phones the pills fill the column and the cart button
             is a thumb away. -->
        <li class="hidden md:block mr-xs">
          <button
            type="button"
            class="cart-toggle block text-[#777] cursor-pointer"
            :aria-expanded="cartOpen"
            aria-controls="cart-drawer"
            @click="toggleCart"
          >
            <span class="sr-only">{{ $t('cart.label') }}</span>

            <IconsBag class="w-[1.9rem]" />
          </button>
        </li>

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
            class="info-link bg-purple text-white"
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
      class="live-link hc-fill"
    >
      <IconsRing />
      <span>{{ live.location || $t('feed.live') }}</span>
    </NuxtLink>
  </header>
</template>

<script setup>
// Internal links carry the /{lang}-{country} prefix of the active locale.
const localePath = useLocalePath()

// Live state for the tab, with this market's location label. The shell is
// cached for up to 10 minutes, so it re-checks once the page is up, then
// whenever the visitor moves to another page or comes back to the tab (at
// most every 30s): a stream starting shows up for anyone browsing, and a
// tab left open in the background makes no requests at all. The live page
// polls the same shared status at its own pace, so the nav stands down there.
const route = useRoute()
const { data: live, refresh } = await useLiveStatus()

const { isOpen: cartOpen, open: openCart, close: closeCart } = useCart()
const toggleCart = () => (cartOpen.value ? closeCart() : openCart())

let checkedAt = 0
const recheck = () => {
  if (route.path.endsWith('/live') || Date.now() - checkedAt < 30_000) return
  checkedAt = Date.now()
  refresh()
}
onNuxtReady(recheck)
watch(() => route.path, recheck)
watch(useDocumentVisibility(), (state) => state === 'visible' && recheck())
</script>

<style scoped>
header {
  z-index: var(--z-nav);
}

.home-link {
  svg {
    width: 5.5rem;
  }
}

nav {
  a {
    padding: 0.6rem var(--spacing-sm);
    border-radius: calc(infinity * 1px);

    /* Filled pills: the ring sits inside the fill, so it reads against the
       pill's own color rather than whichever page background the fixed
       header floats over (the feed pill's grey ring vanished on the grey
       PDP). Same treatment on every filled control site-wide. */
    &:focus-visible {
      outline-offset: -0.2rem;
    }

    @media (min-width: 768px) {
      padding: var(--spacing-xs) var(--spacing-sm);
    }
  }

  /* A white ring inside the purple reads as a border, not focus — the
     accent instead. */
  .info-link:focus-visible {
    outline-color: var(--color-yellow);
  }
}

/* Like the contrast toggle opposite, the bag has no fill behind it, so it
   takes a light grey on the grey and black page templates. */
body.template-pdp .cart-toggle,
body.template-info .cart-toggle,
body.template-feed .cart-toggle,
body.template-live .cart-toggle {
  color: var(--color-grey-1);
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

/* High contrast (.hc-fill): the label takes the fill's text color — red
   fell short on the white fill of the dark pages — and the light keeps
   its red. */
html.high-contrast .live-link :deep(.icon-ring) {
  color: var(--color-red);
}
</style>
