<template>
  <nav class="fixed bottom-0 left-0 w-full px-base">
    <ul class="grid grid-cols-2 gap-base text-lg">
      <li>
        <NuxtLink
          :to="localePath('/')"
          @click="onShopLink"
          >shop</NuxtLink
        >
      </li>

      <li>
        <button
          @click="onCartButton"
          class="cart-button"
          :class="{ 'is-checkout': lineCount > 0 && isOpen }"
          :aria-expanded="isOpen"
          aria-controls="cart-drawer"
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
const { isOpen, lineCount, open, close, checkout, init } = useCart()
const { close: closeQuickAdd } = useQuickAdd()

// Navigating home from the shop button should clear both overlays.
const onShopLink = () => {
  close()
  closeQuickAdd()
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
  if (!isOpen.value) return `cart (${lineCount.value})`
  return lineCount.value > 0 ? 'checkout' : `cart (${lineCount.value})`
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
      height: var(--spacing-button-lg-height);
      display: block;
      text-align: center;
      padding: var(--spacing-sm);
      color: var(--color-grey-5);
      border-top-left-radius: var(--radius-def);
      border-top-right-radius: var(--radius-def);
    }
  }

  .cart-button {
    transition:
      background-color 0.3s,
      color 0.3s;

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
</style>
