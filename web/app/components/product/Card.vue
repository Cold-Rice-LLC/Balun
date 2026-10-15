<template>
  <!-- The title is the link, stretched over the whole card by its ::after,
       so the quick-add button beside it is a sibling control rather than a
       button nested inside a link (invalid, and it swallowed the button's
       name into the link's). -->
  <div
    class="product-card relative"
    :class="{ 'is-unavailable': !live }"
  >
    <div class="image-frame">
      <img
        v-if="cardImage"
        :src="cardImage.src"
        :alt="cardImage.alt"
        loading="lazy"
      />
    </div>

    <div class="card-meta uppercase grid grid-cols-[1fr_auto] items-center gap-x-base">
      <p class="title">
        <NuxtLink
          v-if="live"
          :to="localePath(`/products/${live.handle}`)"
          class="card-link"
          >{{ title }}</NuxtLink
        >
        <template v-else>{{ title }}</template>
      </p>

      <!-- Renders only when live and purchasable (the trigger's own v-if);
           otherwise the stock note below says why there's no "+". No prices
           here — the grid is editorial, price lives on the PDP/quick add. -->
      <ProductQuickAddTrigger
        class="quick-add col-start-2 row-start-1"
        :doc="doc"
        :live="live"
      />

      <!-- col-start pins the note under the title (auto-placement would
           fill the trigger's empty slot beside it instead). -->
      <p
        v-if="live && !live.availableForSale"
        class="stock-note col-start-1"
      >
        {{ $t('product.outOfStock') }}
      </p>

      <p
        v-else-if="!live"
        class="stock-note col-start-1"
      >
        {{ $t('product.unavailable') }}
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * Featured/listing product card. `doc` is the Sanity product (editorial),
 * `live` the matching Storefront API product — null when Shopify doesn't
 * return it (unpublished, or masked from the visitor's market).
 */
const localePath = useLocalePath()

const props = defineProps({
  doc: {
    type: Object,
    required: true,
  },
  live: {
    type: Object,
    default: null,
  },
})

// Titles follow "Base · Color" (colorway convention) — the grid shows the
// base model name; the colorway reads from the image.
const title = computed(() => baseName(props.live?.title || props.doc.title || ''))

// Editorial featuredImage first, Shopify's product image as the fallback —
// so cards still fill without any Sanity work.
const productImage = useProductImage()
const cardImage = computed(() => productImage(props.doc, props.live, { w: 900 }))
</script>

<style scoped>
.product-card {
  color: var(--color-grey-5);

  &.is-unavailable {
    opacity: 0.45;
  }
}

.image-frame {
  aspect-ratio: 3 / 1.6;
  border-radius: var(--radius-def);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
  }
}

/* The link covers the card; the quick-add trigger stacks above the cover so
   it stays its own click. */
.card-link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.card-meta {
  padding: var(--spacing-sm) 0;
  line-height: var(--leading-snug);

  .stock-note {
    color: var(--color-grey-4);
    font-family: var(--font-secondary);
  }
}

/* Bare "+" in the meta row — strip the trigger's default white pill. */
.card-meta .quick-add {
  position: relative;
  z-index: 1;
  width: auto;
  height: auto;
  background: none;
  color: var(--color-grey-5);
  font-size: var(--text-lg);
  font-family: var(--font-secondary);

  &:hover {
    background: none;
    color: var(--color-grey-7);
  }
}
</style>
