<template>
  <button
    class="cart-backdrop"
    :class="{ active: isOpen }"
    @click="close"
  >
    <span class="sr-only">Close cart</span>
  </button>

  <aside
    v-if="isOpen"
    class="cart-drawer"
    aria-label="Cart"
  >
    <div
      v-if="lines.length"
      class="cart-body text-green p-base space-y-base"
    >
      <ul class="lines">
        <li
          v-for="line in lines"
          :key="line.id"
          class="line"
        >
          <span class="thumb">
            <img
              v-if="lineImage(line)"
              :src="lineImage(line).url"
              :alt="lineImage(line).altText || line.merchandise.product.title"
              class="w-full h-full object-cover"
            />
          </span>

          <div class="flex justify-between gap-base">
            <div class="flex flex-col">
              <p class="title text-base uppercase">{{ baseName(line.merchandise.product.title) }}</p>

              <div class="opacity-50 text-sm flex flex-col">
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

              <div class="line-controls text-sm uppercase opacity-50">
                <div class="stepper">
                  <button
                    aria-label="Decrease quantity"
                    @click="updateLine(line.id, line.quantity - 1)"
                  >
                    −
                  </button>
                  <span class="qty">{{ line.quantity }}</span>
                  <button
                    aria-label="Increase quantity"
                    @click="updateLine(line.id, line.quantity + 1)"
                  >
                    +
                  </button>
                </div>

                <button
                  class="remove"
                  @click="removeLine(line.id)"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <div class="summary flex flex-col gap-2 border-t border-grey-3 pt-base">
        <p class="text-base summary-label">Subtotal</p>

        <div class="summary-row text-base flex justify-between">
          <span>{{ lineCount }} {{ lineCount === 1 ? 'item' : 'items' }}</span>
          <span>{{ formatMoney(subtotal) }}</span>
        </div>

        <p class="text-sm note opacity-50">Taxes and shipping calculated at checkout</p>
      </div>
    </div>

    <div
      v-else
      class="cart-empty"
    >
      <p class="text-lg uppercase">Your cart is empty</p>
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

// Product titles follow "Base · Color" (see colorway convention); split for
// the two-line item label. Falls back to the full title when there's no "·".
const baseName = (title = '') => (title.includes('·') ? title.split('·')[0].trim() : title)
const colorName = (title = '') => (title.includes('·') ? title.split('·').pop().trim() : '')

// Prefer the variant image; fall back to the product's featured image.
const lineImage = (line) => line.merchandise.image ?? line.merchandise.product.featuredImage ?? null
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
  left: calc(50% + var(--spacing-base) / 2);
  right: var(--spacing-base);
  bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
  max-height: calc(100svh - var(--spacing-button-lg-height) - var(--spacing-base) * 4);
  display: flex;
  flex-direction: column;
  background-color: var(--color-grey-1);
  border-radius: var(--radius-def);
  color: var(--color-green);
  overflow: hidden;
}

.cart-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.lines {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
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

.line-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  margin-top: var(--spacing-xs);
  color: var(--color-grey-6);

  .stepper {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    button {
      line-height: 1;
    }
  }

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
  min-height: 40svh;
  padding: var(--spacing-base);
  text-align: center;
}

@media (max-width: 768px) {
  .cart-drawer {
    left: var(--spacing-base);
  }
}
</style>
