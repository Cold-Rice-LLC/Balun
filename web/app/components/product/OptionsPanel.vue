<template>
  <div class="options-panel">
    <div class="options font-secondary px-base pb-base space-y-base">
      <div class="sizes">
        <p class="uppercase label">{{ optionLabel }}</p>

        <ul class="grid grid-cols-2 gap-xs">
          <li
            v-for="variant in variants"
            :key="variant.id"
          >
            <button
              class="size-pill"
              :class="{
                'is-selected': variant.id === selectedVariant?.id,
                'is-oos': !variant.availableForSale,
              }"
              :disabled="!variant.availableForSale"
              @click="variantId = variant.id"
            >
              {{ variant.title }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Extension point between sizes and quantity (e.g. the PDP's
           colorway switcher). -->
      <slot />

      <div class="quantity flex items-center justify-between">
        <p class="uppercase label">{{ $t('quickAdd.quantity') }}</p>

        <QuantityStepper
          v-model="quantity"
          class="text-base"
        />
      </div>
    </div>

    <button
      class="add-to-cart text-base-plus"
      :class="{
        'is-adding': addState === 'adding',
        'is-added': addState === 'added',
        'is-failed': addState === 'failed',
      }"
      :disabled="!selectedVariant?.availableForSale || addState === 'adding'"
      @click="addToCart"
    >
      {{ addLabel }}
    </button>
  </div>
</template>

<script setup>
/**
 * The shared variant picker: size pills, quantity, and the add-to-cart
 * button with its idle/adding/added/failed state machine. Wrapped by the
 * quick-add drawer, the PDP's add-to-cart panel, and the live page's
 * featured-product popup — the wrapper owns data fetching, the header
 * (title/price), and positioning; this owns everything from the size grid
 * down.
 *
 * No top padding: the panel expects the wrapper's header (with its own
 * bottom padding) directly above.
 *
 * Selection is exposed as v-model:variant-id so the wrapper can derive the
 * same selected variant (header price, URL sync); left unbound it's local
 * state. Selection and quantity reset when the product changes.
 */
const props = defineProps({
  // Full product detail from the Storefront API (variants.nodes, options).
  product: { type: Object, default: null },
  // Open the cart drawer once an add settles (the quick-add flow).
  openCartOnAdd: { type: Boolean, default: false },
})

// A failed add usually means the cached availability lied — wrappers listen
// to refetch so the pills tell the truth.
const emit = defineEmits(['added', 'addFailed'])

const { t } = useI18n()

const variants = computed(() => props.product?.variants.nodes ?? [])
const optionLabel = computed(() => props.product?.options?.[0]?.name || t('quickAdd.sizeFallback'))

const variantId = defineModel('variantId', { default: null })
const selectedVariant = computed(() => pickVariant(variants.value, variantId.value))

const quantity = ref(1)

watch(
  () => props.product?.id,
  () => {
    variantId.value = null
    quantity.value = 1
    addState.value = 'idle'
  },
)

const addState = ref('idle') // idle | adding | added | failed
let addedTimer = null

const addLabel = computed(() => {
  if (addState.value === 'adding') return t('quickAdd.adding')
  if (addState.value === 'added') return t('quickAdd.added')
  if (addState.value === 'failed') return t('quickAdd.failed')
  if (!selectedVariant.value?.availableForSale) return t('quickAdd.soldOut')
  return t('quickAdd.addToCart')
})

const { open: openCart, addItem } = useCart()

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
      settleAddState('added', 300, props.openCartOnAdd ? openCart : undefined)
      emit('added')
    } else {
      settleAddState('failed', 2400)
      emit('addFailed')
    }
  } catch {
    addState.value = 'idle'
  }
}
onUnmounted(() => clearTimeout(addedTimer))
</script>

<style scoped>
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

.add-to-cart {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--spacing-button-lg-height);
  background-color: var(--color-grey-7);
  color: var(--color-white);
  transition:
    background-color 0.3s,
    color 0.3s;

  &:disabled {
    cursor: not-allowed;
  }

  /* After :disabled so it wins while the add is in flight — "working",
     not "not allowed". */
  &.is-adding {
    cursor: progress;
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
</style>
