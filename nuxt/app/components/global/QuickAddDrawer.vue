<template>
  <button
    class="quick-add-backdrop"
    :class="{ active: isOpen }"
    @click="close"
  >
    <span class="sr-only">Close quick add</span>
  </button>

  <aside
    id="quick-add-drawer"
    class="quick-add-drawer"
    :class="{ active: isOpen }"
    aria-label="Quick add"
  >
    <div class="quick-add-body text-green">
      <div class="p-base space-y-base">
        <header class="flex items-start justify-between gap-base">
          <p class="title text-base uppercase">{{ title }}</p>

          <div class="flex items-center gap-base">
            <p
              v-if="price"
              class="text-base"
            >
              {{ price }}
            </p>

            <button
              class="close"
              aria-label="Close quick add"
              @click="close"
            >
              ✕
            </button>
          </div>
        </header>

        <!-- Bare loading only when there's nothing to show — a same-product
           reopen keeps the sizes visible through the background refresh. -->
        <p
          v-if="pending && !variants.length"
          class="text-xs uppercase state-note"
        >
          Loading sizes…
        </p>

        <template v-else-if="variants.length">
          <div class="sizes">
            <p class="text-2xs uppercase label">{{ optionLabel }}</p>

            <ul class="grid grid-cols-2 gap-xs">
              <li
                v-for="variant in variants"
                :key="variant.id"
              >
                <button
                  class="size-pill text-xs"
                  :class="{
                    'is-selected': variant.id === selectedVariant?.id,
                    'is-oos': !variant.availableForSale,
                  }"
                  :disabled="!variant.availableForSale"
                  @click="selectedId = variant.id"
                >
                  {{ variant.title }}
                </button>
              </li>
            </ul>
          </div>

          <div class="quantity flex items-center justify-between">
            <p class="text-2xs uppercase label">Quantity</p>

            <div class="stepper text-base">
              <button
                aria-label="Decrease quantity"
                @click="quantity = Math.max(1, quantity - 1)"
              >
                −
              </button>
              <span class="qty">{{ quantity }}</span>
              <button
                aria-label="Increase quantity"
                @click="quantity += 1"
              >
                +
              </button>
            </div>
          </div>
        </template>
      </div>

      <div
        v-if="variants.length"
        class="actions space-y-xs"
      >
        <button
          class="add-to-cart text-base"
          :class="{ 'is-added': addState === 'added', 'is-failed': addState === 'failed' }"
          :disabled="!selectedVariant?.availableForSale || addState === 'adding'"
          @click="addToCart"
        >
          {{ addLabel }}
        </button>
      </div>

      <!-- Only after a completed fetch — before the first open there's no
           data at all, and "not available" would be wrong. -->
      <p
        v-else-if="data"
        class="text-xs uppercase state-note"
      >
        Not available in your region
      </p>
    </div>

    <div class="w-1/2">
      <NuxtLink
        v-if="pdpPath"
        :to="pdpPath"
        class="learn-more text-base"
        @click="close"
      >
        learn more
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup>
/**
 * Quick-add overlay panel: the cart drawer's bottom-left mirror, anchored
 * above the "shop" button in SecondaryNav. Opened from a card's quick-add
 * trigger (useQuickAdd), it fetches the product's full variants via the
 * cached /api/product route — the home page's batch read stays lean — and
 * adds to cart in place ("added!") without popping the cart drawer open.
 */
const { active, isOpen, close } = useQuickAdd()
const localePath = useLocalePath()

// Keep the last product while closing so the panel doesn't blank out
// mid slide-down transition.
const handle = ref('')

// immediate/watch false: handle is '' until the first open (an immediate
// fetch would 400), and we drive refreshes ourselves below — with
// immediate:false Nuxt doesn't start the query watcher until a manual
// execute, so relying on it silently never fetches.
const { data, pending, execute } = useShopifyProduct(handle, {
  immediate: false,
  watch: false,
})

// Gid of the product being shown; outlives `active` (close nulls it) so a
// late response still maps to the right catalog entry.
const activeGid = ref('')

watch(active, (payload) => {
  if (!payload?.live?.handle) return
  activeGid.value = payload.live.id ?? ''
  if (payload.live.handle !== handle.value) {
    handle.value = payload.live.handle
    // The previous product's sizes are stale — show the loading state.
    data.value = null
  }
  // Refresh on every open; cheap thanks to the 60s SWR cache server-side.
  execute()
})

// Report what the detail fetch learned to the shared catalog so the cards
// behind this drawer stay consistent with it. Loaded-but-null = masked from
// this market — real info, mapped via the gid the card handed us.
const { report } = useLiveCatalog()
watch(data, (val) => {
  if (!val) return
  if (val.product?.id) report(val.product.id, val.product)
  else if (activeGid.value) report(activeGid.value, null)
})

const detail = computed(() => data.value?.product ?? null)
const variants = computed(() => detail.value?.variants.nodes ?? [])
const optionLabel = computed(() => detail.value?.options?.[0]?.name || 'Size')

// Titles follow "Base · Color" (colorway convention) — header shows the base.
const title = computed(() => {
  const full = active.value?.live?.title ?? detail.value?.title ?? ''
  return full.includes('·') ? full.split('·')[0].trim() : full
})

// Selected size: explicit pick, else first purchasable. Reset per product.
const selectedId = ref(null)
const selectedVariant = computed(
  () =>
    variants.value.find((v) => v.id === selectedId.value) ??
    variants.value.find((v) => v.availableForSale) ??
    variants.value[0] ??
    null,
)

const price = computed(() =>
  formatMoney(selectedVariant.value?.price ?? active.value?.live?.priceRange?.minVariantPrice),
)

const pdpPath = computed(() => (handle.value ? localePath(`/products/${handle.value}`) : null))

const quantity = ref(1)
watch(active, (payload) => {
  if (!payload) return
  selectedId.value = null
  quantity.value = 1
  addState.value = 'idle'
})

const { isOpen: cartOpen, open: openCart, addItem } = useCart()
// The reverse of useQuickAdd.open() closing the cart: cart opening closes us.
watch(cartOpen, (open) => {
  if (open) close()
})
const addState = ref('idle') // idle | adding | added | failed
let addedTimer = null

const addLabel = computed(() => {
  if (addState.value === 'adding') return 'adding…'
  if (addState.value === 'added') return 'added!'
  if (addState.value === 'failed') return 'couldn’t add'
  if (!selectedVariant.value?.availableForSale) return 'sold out'
  return 'add to cart'
})

const settleAddState = (state, holdMs, onSettled) => {
  addState.value = state
  clearTimeout(addedTimer)
  addedTimer = setTimeout(() => {
    addState.value = 'idle'
    onSettled?.()
  }, holdMs)
}

const addToCart = async () => {
  if (!selectedVariant.value?.availableForSale || addState.value === 'adding') return
  addState.value = 'adding'
  try {
    const result = await addItem(selectedVariant.value.id, quantity.value, { openCart: false })
    if (result) {
      settleAddState('added', 300, openCart)
    } else {
      // Most likely the variant sold out under our cached data — refetch so
      // the size grid (and, via the report watch, the cards) tell the truth.
      settleAddState('failed', 2400)
      execute()
    }
  } catch {
    addState.value = 'idle'
  }
}
onUnmounted(() => clearTimeout(addedTimer))
</script>

<style scoped>
.quick-add-backdrop {
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

.quick-add-drawer {
  position: fixed;
  z-index: 4900;
  bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
  left: var(--spacing-base);
  width: calc(50vw - (var(--spacing-base) * 1.5));
  max-height: calc(100svh - var(--spacing-button-lg-height) - var(--spacing-base) * 4);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  color: var(--color-green);
  transform: translateY(3rem);
  transition:
    transform 0.3s,
    opacity 0.3s;
  opacity: 0;
  gap: var(--spacing-base);
  pointer-events: none;

  &.active {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
}

.quick-add-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  background-color: var(--color-grey-1);
  border-radius: var(--radius-def);
  width: 50%;
}

.close {
  line-height: 1;
  color: var(--color-grey-6);
}

.state-note,
.label {
  color: var(--color-grey-6);
}

.sizes .label {
  margin-bottom: var(--spacing-xs);
}

.size-pill {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: calc(var(--radius-def) / 2);
  background-color: var(--color-grey-2);
  color: var(--color-grey-6);
  transition:
    background-color 0.2s,
    color 0.2s;

  &.is-selected {
    background-color: var(--color-grey-7);
    color: var(--color-white);
  }

  &.is-oos {
    opacity: 0.4;
    cursor: not-allowed;
    text-decoration: line-through;
  }
}

.stepper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  button {
    line-height: 1;
  }
}

.add-to-cart {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--spacing-button-lg-height);
  background-color: var(--color-grey-2);
  color: var(--color-grey-6);
  transition:
    background-color 0.3s,
    color 0.3s;
}

.learn-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--spacing-button-lg-height);
  border-radius: var(--radius-def);
  background-color: var(--color-grey-2);
  color: var(--color-grey-6);
  transition:
    background-color 0.3s,
    color 0.3s;
}

.add-to-cart {
  &:disabled {
    cursor: not-allowed;
  }

  &.is-added {
    background-color: var(--color-green-bright);
    color: var(--color-white);
  }

  &.is-failed {
    background-color: var(--color-orange);
    color: var(--color-white);
  }
}

@media (max-width: 768px) {
  .quick-add-drawer {
    left: var(--spacing-base);
    right: var(--spacing-base);
    width: auto;
  }
}
</style>
