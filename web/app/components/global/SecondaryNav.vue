<template>
  <nav
    class="fixed bottom-0 left-0 w-full px-base"
    :aria-label="$t('nav.shopCart')"
  >
    <ul class="grid grid-cols-2 gap-base text-base-plus lg:text-lg">
      <li>
        <NuxtLink
          :to="localePath('/products')"
          @click="onShopLink"
          >{{ $t('nav.shop') }}</NuxtLink
        >
      </li>

      <li>
        <!-- A disclosure toggle while it opens and closes the drawer; once it
             reads "checkout" it navigates instead, so the toggle semantics
             come off. -->
        <button
          type="button"
          class="cart-button"
          :class="{ 'is-checkout': isCheckout }"
          :aria-expanded="isCheckout ? undefined : isOpen"
          :aria-controls="isCheckout ? undefined : 'cart-drawer'"
          @click="onCartButton"
        >
          <span
            class="cart-label"
            :class="{ ready }"
            >{{ cartLabel }}</span
          >
        </button>
      </li>
    </ul>

    <!-- Cart changes announce here: the only other signal is the count in
         the button label. Skips the initial load (the region is empty until
         the first change after init). -->
    <p
      class="sr-only"
      aria-live="polite"
    >
      {{ cartAnnouncement }}
    </p>

    <!-- Rendered inside the nav so the cart button and drawer it controls
         (aria-controls) live in the same landmark for assistive tech. -->
    <CartDrawer />
    <QuickAddDrawer />
  </nav>
</template>

<script setup>
const localePath = useLocalePath()
const route = useRoute()
const { t } = useI18n()
const { isOpen, lineCount, open, close, checkout, init } = useCart()
const { close: closeQuickAdd } = useQuickAdd()

// The shop button should clear both overlays on the way to the Shop page.
// Already there, the NuxtLink is a no-op — scroll to the top instead (instantly
// under reduced motion). nextTick: closing the overlays releases the scroll
// lock on the watcher flush, and scrollTo is itself a no-op while html
// overflow is still hidden.
const onShopLink = () => {
  close()
  closeQuickAdd()
  const strip = (p) => p.replace(/\/+$/, '')
  if (strip(route.path) === strip(localePath('/products'))) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    nextTick(() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }))
  }
}

// Hide the "cart (N)" label until the persisted cart has actually been
// fetched, so it fades in with the real count instead of flashing "(0)".
const ready = ref(false)
onMounted(async () => {
  await init()
  ready.value = true
})

// Closed → "cart (N)"; open with items → "checkout"; open empty → "cart".
const isCheckout = computed(() => isOpen.value && lineCount.value > 0)
const cartLabel = computed(() => (isCheckout.value ? t('nav.checkout') : t('nav.cart', { n: lineCount.value })))

// Announce count changes once the persisted cart is in (its arrival is not
// a change the visitor made).
const cartAnnouncement = ref('')
watch(lineCount, (n) => {
  if (ready.value) cartAnnouncement.value = t('cart.updated', { items: t('cart.items', n) })
})

// Open the drawer; once open, the button checks out (if filled) or closes it.
const onCartButton = () => {
  if (!isOpen.value) open()
  else if (lineCount.value > 0) checkout()
  else close()
}
</script>

<style scoped>
nav {
  z-index: var(--z-nav);

  /* The drawer now renders inside this nav, so its z-index competes with the
     button list in the same stacking context. Keep the checkout button (and
     its list) above the drawer and backdrop so it stays visible and clickable. */
  ul {
    position: relative;
    z-index: calc(var(--z-drawer) + 1);
  }

  li {
    a,
    button {
      background-color: var(--color-grey-1);
      width: 100%;
      height: var(--spacing-button-md-height);
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: var(--spacing-sm);
      color: var(--color-grey-7);
      border-top-left-radius: var(--radius-def);
      border-top-right-radius: var(--radius-def);
      /* Both buttons cross-fade with the body bg on template changes (the
         info override below) and the cart button's checkout state. */
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
  }

  .cart-button {
    &.is-checkout {
      background-color: var(--color-yellow);
      color: var(--color-green);
    }

    .cart-label {
      opacity: 0;
      transition: opacity 0.3s;

      &.ready {
        opacity: 1;
      }
    }
  }
}

/* Black-page templates (info, feed): darker buttons — grey-6, white text.
   The checkout state's own rule out-specifies this (three classes vs two),
   so an open filled cart stays yellow. */
body.template-info nav li,
body.template-feed nav li {
  a,
  button {
    background-color: var(--color-grey-6);
    color: var(--color-white);
  }
}
</style>
