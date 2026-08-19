<template>
  <nav class="fixed bottom-0 left-0 w-full px-base">
    <ul class="grid grid-cols-2 gap-base text-base-plus lg:text-lg">
      <li>
        <NuxtLink
          :to="localePath('/')"
          @click="onShopLink"
          >{{ $t('nav.shop') }}</NuxtLink
        >
      </li>

      <li>
        <button
          class="cart-button"
          :class="{ 'is-checkout': lineCount > 0 && isOpen }"
          :aria-expanded="isOpen"
          aria-controls="cart-drawer"
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

// Navigating home from the shop button should clear both overlays. Already
// on home, the NuxtLink is a no-op — scroll to the top instead. nextTick:
// closing the overlays releases the scroll lock on the watcher flush, and
// scrollTo is itself a no-op while html overflow is still hidden.
const onShopLink = () => {
  close()
  closeQuickAdd()
  const strip = (p) => p.replace(/\/+$/, '')
  if (strip(route.path) === strip(localePath('/'))) {
    nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
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
const cartLabel = computed(() => {
  if (!isOpen.value) return t('nav.cart', { n: lineCount.value })
  return lineCount.value > 0 ? t('nav.checkout') : t('nav.cart', { n: lineCount.value })
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
  z-index: 5000;

  /* The drawer now renders inside this nav, so its z-index competes with the
     button list in the same stacking context. Keep the checkout button (and
     its list) above the drawer and backdrop so it stays visible and clickable. */
  ul {
    position: relative;
    z-index: 4901;
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
