<template>
  <header class="fixed top-0 left-0 w-full grid grid-cols-3 py-base px-gutter">
    <!-- High-contrast switch, top left (only while Site Settings has it on). -->
    <ContrastToggle class="self-start lg:self-center" />

    <div class="col-start-2 flex justify-center items-center">
      <!-- Home only: the "balun" wordmark stands in for the logo at the top
           of the page, and the two swap — one fading out, then the other in
           — once the visitor scrolls. The wordmark hangs from the logo's top
           edge rather than taking space, so the header keeps its height. -->
      <NuxtLink
        :to="localePath('/')"
        class="home-link relative block text-grey-3"
        :class="{ 'show-wordmark': showWordmark }"
      >
        <span class="sr-only">Balun</span>

        <IconsLogo />

        <IconsWordmark v-if="isHome" />
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
            ref="bag"
            type="button"
            class="cart-toggle block text-[#777] cursor-pointer transition-colors"
            :class="{ 'on-light': onLight }"
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

// The wordmark shows on the home page until the visitor scrolls past the
// first few pixels. y is 0 on the server, so the cached shell renders it.
const strip = (p) => p.replace(/\/+$/, '')
const isHome = computed(() => strip(route.path) === strip(localePath('/')))
const { y: scrollY } = useWindowScroll()
const showWordmark = computed(() => isHome.value && scrollY.value < 40)

const { isOpen: cartOpen, open: openCart, close: closeCart } = useCart()
const toggleCart = () => (cartOpen.value ? closeCart() : openCart())

// Whether the bag is over a light surface on a dark page (an element marked
// data-nav-light — the PDP's white details column), so it can turn dark
// there. Checked against the bag's own center as the page scrolls or
// resizes, and on arrival; a colorway switch swaps the column through an
// out-in transition, so that check runs again once it has landed.
const bag = ref(null)
const onLight = ref(false)
const checkSurface = () => {
  const box = bag.value?.getBoundingClientRect()
  if (!box?.width) return (onLight.value = false)
  const x = box.left + box.width / 2
  const y = box.top + box.height / 2
  onLight.value = [...document.querySelectorAll('[data-nav-light]')].some((el) => {
    const r = el.getBoundingClientRect()
    return r.top <= y && r.bottom >= y && r.left <= x && r.right >= x
  })
}
onMounted(checkSurface)
useEventListener('scroll', checkSurface, { passive: true })
useEventListener('resize', checkSurface)
watch(
  () => route.path,
  () => {
    nextTick(checkSurface)
    setTimeout(checkSurface, 600)
  },
)

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

/* Out: the wordmark fades straight away, the logo after it (the delay);
   back at the top it runs the other way round. */
.home-link {
  .icon-logo {
    width: 5.5rem;
    transition: opacity 0.3s 0.3s;
  }

  .icon-wordmark {
    position: absolute;
    top: 0;
    left: 50%;
    width: 11rem;
    transform: translateX(-50%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;

    @media (min-width: 768px) {
      width: 15rem;
    }

    /* A touch under the mockup's 22.7rem, for the modules below it; the
       home page's headroom makes up the rest (pages/index.vue). */
    @media (min-width: 1024px) {
      width: 20rem;
    }
  }

  &.show-wordmark {
    .icon-logo {
      opacity: 0;
      transition-delay: 0s;
    }

    .icon-wordmark {
      opacity: 1;
      pointer-events: auto;
      transition-delay: 0.3s;
    }
  }

  svg {
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
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

/* The bag has no fill behind it, so it turns white on the grey and black
   page templates — and dark grey again where it passes over the PDP's
   white details column. */
body.template-pdp .cart-toggle,
body.template-info .cart-toggle,
body.template-feed .cart-toggle,
body.template-live .cart-toggle {
  color: var(--color-white);
}

body.template-pdp .cart-toggle.on-light {
  color: var(--color-grey-6);
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
