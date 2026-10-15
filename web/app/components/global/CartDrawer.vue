<template>
  <!-- inert while closed: the drawer is only slid off-screen, so without it
       every line link, stepper and the close button would stay in the tab
       order and the accessibility tree. -->
  <button
    class="overlay-backdrop z-(--z-backdrop)"
    :class="{ active: isOpen }"
    :inert="!isOpen"
    @click="close"
  >
    <span class="sr-only">{{ $t('cart.close') }}</span>
  </button>

  <!-- A dialog, not a modal one: the nav stays clickable while it's open
       (from 768px its cart button is the checkout). Tab stays inside the
       drawer plus that button until it closes. -->
  <aside
    id="cart-drawer"
    ref="drawerEl"
    class="cart-drawer"
    :class="{ active: isOpen }"
    role="dialog"
    :aria-label="$t('cart.label')"
    :inert="!isOpen"
  >
    <!-- The quick-add drawer's panel mirrored: the close tab hangs off the
         left edge (the drawer hugs the viewport's right side), and sits on
         top, flush left, on mobile. -->
    <NotchPanel class="cart-panel tab-left tab-top-max-md h-full">
      <div
        v-if="lines.length"
        class="cart-body text-green md:pb-base flex-1 flex flex-col"
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
               closes the drawer over it. The thumb is hidden from keyboard
               and screen readers: the title link beside it is the same link
               with the same name, so this one would only repeat it. -->
            <NuxtLink
              class="thumb"
              :to="pdpPath(line)"
              tabindex="-1"
              aria-hidden="true"
              @click="close"
            >
              <img
                v-if="lineImage(line)"
                :src="lineImage(line).url"
                loading="lazy"
                :alt="lineImage(line).altText || ''"
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

              <div class="ml-auto flex flex-col justify-between items-end h-full">
                <p class="line-price text-base leading-none">
                  {{ formatPrice(line.cost.totalAmount) }}
                </p>

                <div class="line-controls text-sm uppercase">
                  <QuantityStepper
                    :model-value="line.quantity"
                    :min="0"
                    :aria-label="$t('quickAdd.quantity')"
                    :disabled="pending"
                    @update:model-value="onUpdate(line.id, $event)"
                  />

                  <button
                    type="button"
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
              <span>{{ formatPrice(subtotal) }}</span>
            </div>

            <p class="text-sm note opacity-50">{{ $t('cart.taxesNote') }}</p>
          </div>
        </div>

        <!-- Mobile: the drawer covers the secondary nav, so checkout lives
           here, full width at the bottom edge. From 768px it stays the
           nav's cart button. -->
        <button
          type="button"
          class="checkout md:hidden flex-none text-base-plus"
          :disabled="pending"
          @click="checkout"
        >
          {{ $t('nav.checkout') }}
        </button>
      </div>

      <div
        v-else
        class="cart-empty"
      >
        <p class="text-base-plus lg:text-lg uppercase">{{ $t('cart.empty') }}</p>
      </div>

      <template #tab>
        <button
          ref="closeButton"
          class="notch-close notch-close-tall text-grey-6"
          :aria-label="$t('cart.close')"
          @click="close"
        >
          <IconsX />
          <span class="sr-only">{{ $t('cart.close') }}</span>
        </button>
      </template>
    </NotchPanel>
  </aside>
</template>

<script setup>
/**
 * Cart overlay panel (see the cart-pass mockups). Filled state = line items +
 * subtotal; empty state = "Your cart is empty". Anchored bottom-right above the
 * SecondaryNav bar. CHECKOUT: on mobile the drawer covers the nav and carries
 * its own full-width button; from 768px the action is the nav's cart button.
 */
const { isOpen, lines, lineCount, subtotal, close, checkout, updateLine, removeLine } = useCart()
const formatPrice = useMoney()

useScrollLock(isOpen)

// Keyboard: Escape closes; Tab cycles inside; focus moves to the close
// button on open and back to whatever opened it on close (the nav button keeps it
// when it did the closing). Opened by an add to cart, the opener is the add button inside
// the quick-add drawer or buy panel, inert or gone by then — the nav's cart
// button is the fallback.
onKeyStroke('Escape', () => {
  if (isOpen.value) close()
})
const drawerEl = ref(null)
const closeButton = ref(null)
useOverlayFocus(isOpen, {
  root: () => drawerEl.value,
  initial: () => closeButton.value,
  fallback: () => document.querySelector('[aria-controls="cart-drawer"]'),
  // From 768px the nav's cart button is the drawer's checkout, so it joins
  // the cycle; below that the drawer covers it and carries its own.
  trap: true,
  include: () =>
    matchMedia('(width >= 768px)').matches ? [drawerEl.value?.closest('nav')?.querySelector('.cart-button')] : [],
})

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

// Prefer the variant image; fall back to the product's featured image.
const lineImage = (line) => line.merchandise.image ?? line.merchandise.product.featuredImage ?? null

// The line's PDP (handle rides along on the cart query's product).
const localePath = useLocalePath()
const pdpPath = (line) => localePath(`/products/${line.merchandise.product.handle}`)
</script>

<style scoped>
.cart-drawer {
  position: fixed;
  bottom: 0;
  right: var(--spacing-base);
  /* Full width on mobile; the right column from 768px up. */
  left: var(--spacing-base);
  height: 50rem;
  color: var(--color-green);
  transform: translateY(100%);
  transition: transform 0.3s;

  &.active {
    transform: translateY(0);
  }

  /* Mobile covers the secondary nav (its button row sits one above the
     drawer layer in the shared stacking context) — the in-drawer checkout replaces it. From
     768px the drawer ducks back under the nav, whose cart button is the
     checkout action, and clears it with the bottom padding. */
  z-index: calc(var(--z-drawer) + 2);

  @media (min-width: 768px) {
    z-index: var(--z-drawer);
    left: calc(50% + var(--spacing-base) / 2);
    transform: translateY(calc(100% - var(--spacing-button-lg-height)));
  }
}

.cart-panel {
  --notch-tab-radius: 3rem;

  /* The quick-add tab nudges its X toward the body; the mirror nudges it
     the other way. */
  & .notch-close-tall .icon-x {
    @media (width >= 768px) {
      transform: translateX(0.5rem);
    }
  }
}

/* Closed, the drawer only slides down: the tab, outside the body rect,
   would still show — above the body on mobile, in the gap between the nav
   buttons from 768px. */
.cart-panel :deep(.panel-tab) {
  opacity: 0;
  transition: opacity 0.3s;
}

.cart-drawer.active .cart-panel :deep(.panel-tab) {
  opacity: 1;
}

/* Closed, the top-left corner rounds again: from 768px the drawer's top
   edge waits under the nav's cart button, and the square corner the tab
   needs would fill in the button's rounded one. It squares as the tab
   fades in. */
.cart-drawer:not(.active) .cart-panel :deep(.panel-body) {
  border-top-left-radius: var(--radius-def);
}

/* Square along the bottom edge (it sits on the viewport bottom, or under
   the nav from 768px — where it clears the nav with the bottom padding). */
.cart-panel :deep(.panel-body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  transition: border-top-left-radius 0.3s;

  @media (width >= 768px) {
    padding-bottom: var(--spacing-button-lg-height);
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
  /* Smaller thumb on mobile so price + stepper + remove fit beside the
     title instead of wrapping below it. */
  grid-template-columns: 5.5rem 1fr;
  gap: var(--spacing-base);
  align-items: start;

  @media (min-width: 768px) {
    grid-template-columns: 8rem 1fr;
  }
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
  /* Mobile: remove sits under the stepper to keep the column narrow. */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  color: var(--color-grey-6);

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-base);
  }

  .remove {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
}

.note {
  color: var(--color-grey-6);
}

/* Yellow like the nav button's checkout state — same action, same color. */
.checkout {
  height: var(--spacing-button-md-height);
  background-color: var(--color-yellow);
  color: var(--color-green);
  transition:
    background-color 0.3s,
    color 0.3s;

  &:disabled {
    cursor: progress;
  }

  /* Filled control: ring inside the fill (see MainNav). */
  &:focus-visible {
    outline-offset: -0.2rem;
  }
}

.cart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-base);
  text-align: center;
  flex: 1;
}
</style>
