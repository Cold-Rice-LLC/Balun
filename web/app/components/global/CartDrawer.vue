<template>
  <button
    class="cart-backdrop"
    :class="{ active: isOpen }"
    @click="close"
  >
    <span class="sr-only">{{ $t('cart.close') }}</span>
  </button>

  <aside
    id="cart-drawer"
    class="cart-drawer"
    :class="{ active: isOpen }"
    aria-label="Cart"
  >
    <div
      v-if="lines.length"
      class="cart-body text-green pb-base h-full flex flex-col"
      :class="{ 'is-pending': pending }"
      :aria-busy="pending"
    >
      <ul class="lines flex-1 p-base">
        <li
          v-for="line in lines"
          :key="line.id"
          class="line font-secondary"
        >
          <!-- Thumb and title link back to the line's PDP; navigating away
               closes the drawer over it. -->
          <NuxtLink
            class="thumb"
            :to="pdpPath(line)"
            :aria-label="line.merchandise.product.title"
            @click="close"
          >
            <img
              v-if="lineImage(line)"
              :src="lineImage(line).url"
              :alt="lineImage(line).altText || line.merchandise.product.title"
              class="w-full h-full object-cover"
            />
          </NuxtLink>

          <div class="flex justify-between gap-base">
            <div class="flex flex-col gap-2">
              <NuxtLink
                class="title text-base uppercase leading-none"
                :to="pdpPath(line)"
                @click="close"
              >
                {{ baseName(line.merchandise.product.title) }}
              </NuxtLink>

              <div class="opacity-50 text-sm flex flex-col gap-1">
                <p
                  v-if="colorName(line.merchandise.product.title)"
                  class="sub"
                >
                  {{ colorName(line.merchandise.product.title) }}
                </p>
                <p class="sub">{{ line.merchandise.title }}</p>
              </div>
            </div>

            <div class="flex flex-col justify-between items-end h-full">
              <p class="line-price text-base">
                {{ formatMoney(line.cost.totalAmount) }}
              </p>

              <div class="line-controls text-sm uppercase">
                <QuantityStepper
                  :model-value="line.quantity"
                  :min="0"
                  :disabled="pending"
                  @update:model-value="onUpdate(line.id, $event)"
                />

                <button
                  class="remove"
                  :disabled="pending"
                  @click="onRemove(line.id)"
                >
                  {{ $t('cart.remove') }}
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <div class="summary font-secondary flex-none px-base pb-base">
        <div class="border-t border-grey-5 pt-base flex flex-col gap-3">
          <p class="text-base summary-label">{{ $t('cart.subtotal') }}</p>

          <div class="summary-row text-base flex justify-between">
            <span>{{ $t('cart.items', lineCount) }}</span>
            <span>{{ formatMoney(subtotal) }}</span>
          </div>

          <p class="text-sm note opacity-50">{{ $t('cart.taxesNote') }}</p>
        </div>
      </div>
    </div>

    <div
      v-else
      class="cart-empty"
    >
      <p class="text-lg uppercase">{{ $t('cart.empty') }}</p>
    </div>
  </aside>
</template>

<script setup>
/**
 * Cart overlay panel (see the cart-pass mockups). Filled state = line items +
 * subtotal; empty state = "Your cart is empty". Anchored bottom-right above the
 * SecondaryNav bar; the CHECKOUT action lives in that bar, not here.
 */
const { isOpen, lines, lineCount, subtotal, close, updateLine, removeLine } = useCart()

useScrollLock(isOpen)

// Line mutations hit the Storefront API async; flag while one is in flight so
// the controls can show a progress cursor and disable to prevent double-taps.
const pending = ref(false)
const onUpdate = async (id, quantity) => {
  pending.value = true
  try {
    await updateLine(id, quantity)
  } finally {
    pending.value = false
  }
}
const onRemove = async (id) => {
  pending.value = true
  try {
    await removeLine(id)
  } finally {
    pending.value = false
  }
}

// Product titles follow "Base · Color" (see colorway convention); split for
// the two-line item label. Falls back to the full title when there's no "·".
const baseName = (title = '') => (title.includes('·') ? title.split('·')[0].trim() : title)
const colorName = (title = '') => (title.includes('·') ? title.split('·').pop().trim() : '')

// Prefer the variant image; fall back to the product's featured image.
const lineImage = (line) => line.merchandise.image ?? line.merchandise.product.featuredImage ?? null

// The line's PDP (handle rides along on the cart query's product).
const localePath = useLocalePath()
const pdpPath = (line) => localePath(`/products/${line.merchandise.product.handle}`)
</script>

<style scoped>
.cart-backdrop {
  position: fixed;
  inset: 0;
  z-index: 4800;
  background-color: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(6px);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;

  &.active {
    opacity: 1;
    pointer-events: auto;
  }
}

.cart-drawer {
  position: fixed;
  z-index: 4900;
  bottom: 0;
  right: var(--spacing-base);
  /* Full width on mobile; the right column from 768px up. */
  left: var(--spacing-base);
  height: 50rem;
  display: flex;
  flex-direction: column;
  background-color: var(--color-grey-1);
  border-top-left-radius: var(--radius-def);
  border-top-right-radius: var(--radius-def);
  padding-bottom: var(--spacing-button-lg-height);
  overflow: hidden;
  color: var(--color-green);
  transform: translateY(calc(100% - var(--spacing-button-lg-height)));
  transition: transform 0.3s;

  &.active {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    left: calc(50% + var(--spacing-base) / 2);
  }
}

.cart-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* While a line mutation is in flight: progress cursor + dim the controls so
   the pending state reads even though the numbers haven't updated yet. */
.cart-body.is-pending {
  cursor: progress;

  .line-controls {
    opacity: 0.4;
    transition: opacity 0.2s;
  }
}

/* :deep so the progress cursor reaches the stepper's buttons too. Top-level
   because the scoped-CSS compiler mangles :deep() inside nested blocks. */
.cart-body.is-pending .line-controls :deep(button) {
  cursor: progress;
}

.lines {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  scrollbar-width: none;
}

.line {
  display: grid;
  grid-template-columns: 8rem 1fr;
  gap: var(--spacing-base);
  align-items: start;
}

.thumb {
  display: block;
  aspect-ratio: 1;
  background-color: var(--color-white);
  border-radius: calc(var(--radius-def) / 2);
  overflow: hidden;
}

.title:hover {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.line-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  margin-top: var(--spacing-xs);
  color: var(--color-grey-6);

  .remove {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
}

.note {
  color: var(--color-grey-6);
}

.cart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-base);
  text-align: center;
  height: 100%;
}

</style>
