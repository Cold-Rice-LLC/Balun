<template>
  <nav class="fixed bottom-0 left-0 w-full px-base">
    <ul class="grid grid-cols-2 gap-base text-lg">
      <li>
        <NuxtLink
          :to="localePath('/')"
          @click="close"
          >shop</NuxtLink
        >
      </li>

      <li>
        <button @click="onCartButton">{{ cartLabel }}</button>
      </li>
    </ul>
  </nav>
</template>

<script setup>
const localePath = useLocalePath()
const { isOpen, lineCount, open, close, checkout, init } = useCart()

// Load any persisted cart once on mount (client-only).
onMounted(init)

// Closed → "cart (N)"; open with items → "checkout"; open empty → "cart".
const cartLabel = computed(() => {
  if (!isOpen.value) return `cart (${lineCount.value})`
  return lineCount.value > 0 ? 'checkout' : 'cart'
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
}
</style>
