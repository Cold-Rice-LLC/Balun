<template>
  <div
    class="buy-box"
    :class="{ 'is-refreshing': pending && live }"
  >
    <!-- Only show a bare loading state on the very first load (no data yet).
         During a colorway refetch we keep the previous content visible and
         just dim it, so the box updates instead of collapsing. -->
    <p
      v-if="pending && !live"
      class="text-xs uppercase state-note"
    >
      {{ $t('buyBox.loading') }}
    </p>

    <template v-else-if="live">
      <p class="price text-base">
        {{ formatMoney(selectedVariant?.price ?? live.priceRange.minVariantPrice) }}

        <s
          v-if="compareAt"
          class="compare-at"
          >{{ compareAt }}</s
        >
      </p>

      <div
        v-if="live.variants.nodes.length > 1"
        class="variants"
      >
        <p class="text-2xs uppercase label">{{ live.options[0]?.name || $t('buyBox.optionFallback') }}</p>

        <ul class="flex flex-wrap gap-xs">
          <li
            v-for="variant in live.variants.nodes"
            :key="variant.id"
          >
            <button
              class="variant-pill text-2xs"
              :class="{
                'is-selected': variant.id === selectedVariantId,
                'is-oos': !variant.availableForSale,
              }"
              :disabled="!variant.availableForSale"
              @click="selectVariant(variant)"
            >
              {{ variant.title }}
            </button>
          </li>
        </ul>
      </div>

      <button
        class="add-to-cart uppercase text-xs"
        :disabled="!selectedVariant?.availableForSale || adding"
        @click="addToCart"
      >
        {{ addToCartLabel }}
      </button>
    </template>

    <p
      v-else
      class="text-xs uppercase state-note"
    >
      {{ $t('buyBox.unavailable') }}
    </p>
  </div>
</template>

<script setup>
/**
 * The buy-box island: the only geo-varying part of the PDP. Receives live
 * Storefront data (already market-priced via @inContext) from the parent's
 * client-side fetch; the surrounding page shell is cached per locale URL.
 *
 * Variant selection uses the flat variant list (title = size for
 * single-option products). If products ever get multi-option matrices
 * (size × material), upgrade to per-option pickers.
 */
const props = defineProps({
  live: {
    type: Object,
    default: null,
  },
  pending: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// Shopify variant GIDs are gid://shopify/ProductVariant/<numericId>; the URL
// carries just the numeric id (Shopify's ?variant= convention) so links are
// clean and shareable.
const variantNumericId = (gid) => gid.split('/').pop()

// Selected variant is derived from the URL (?variant=), so a selection is
// shareable/linkable and survives reload. Falls back to the first purchasable
// size when the URL has no (or an unknown) variant.
const selectedVariant = computed(() => {
  const variants = props.live?.variants.nodes ?? []
  if (!variants.length) return null

  const fromUrl = route.query.variant
  if (fromUrl) {
    const match = variants.find((v) => variantNumericId(v.id) === String(fromUrl))
    if (match) return match
  }
  return variants.find((v) => v.availableForSale) ?? variants[0]
})

const selectedVariantId = computed(() => selectedVariant.value?.id ?? null)

// Write the selection to the URL (replace, not push — size taps shouldn't
// stack history entries). Handle stays the same, so no data refetch fires.
const selectVariant = (variant) => {
  router.replace({ query: { ...route.query, variant: variantNumericId(variant.id) } })
}

const compareAt = computed(() => {
  const price = selectedVariant.value?.compareAtPrice
  return price && Number(price.amount) > 0 ? formatMoney(price) : null
})

const { addItem } = useCart()
const adding = ref(false)

const addToCartLabel = computed(() => {
  if (adding.value) return t('buyBox.adding')
  if (!selectedVariant.value?.availableForSale) return t('buyBox.soldOut')
  return t('buyBox.addToCart')
})

const addToCart = async () => {
  if (!selectedVariantId.value || adding.value) return
  adding.value = true
  try {
    await addItem(selectedVariantId.value)
  } finally {
    adding.value = false
  }
}
</script>

<style scoped>
.buy-box {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  transition: opacity 0.15s ease;

  &.is-refreshing {
    opacity: 0.5;
  }
}

.state-note,
.label {
  color: var(--color-grey-6);
}

.compare-at {
  color: var(--color-grey-6);
  margin-left: var(--spacing-xs);
}

.variants .label {
  margin-bottom: var(--spacing-xs);
}

.variant-pill {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: calc(infinity * 1px);
  background-color: var(--color-grey-1);
  color: var(--color-grey-6);

  &.is-selected {
    background-color: var(--color-yellow);
    color: var(--color-black);
  }

  &.is-oos {
    opacity: 0.4;
    cursor: not-allowed;
    text-decoration: line-through;
  }
}

.add-to-cart {
  height: var(--spacing-button-lg-height);
  border-radius: var(--radius-def);
  background-color: var(--color-grey-1);
  color: var(--color-grey-5);

  &:disabled {
    cursor: not-allowed;
  }
}
</style>
