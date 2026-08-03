<template>
  <nav
    v-if="items.length"
    class="colorways"
    aria-label="Colorways"
  >
    <ul class="grid grid-cols-3 gap-xs">
      <li
        v-for="item in entries"
        :key="item.doc._id"
      >
        <component
          :is="item.live && !item.current ? NuxtLink : 'div'"
          :to="item.live && !item.current ? localePath(`/products/${item.doc.slug}`) : undefined"
          class="colorway-link block"
          :class="{ 'is-unavailable': item.unavailable, 'is-current': item.current }"
          :aria-current="item.current ? 'true' : undefined"
        >
          <span class="thumb block rounded-sm">
            <img
              v-if="item.image"
              :src="item.image.src"
              :alt="item.image.alt"
              loading="lazy"
            />

            <!-- Corner-to-corner cross: preserveAspectRatio none stretches
                 the viewBox to the thumb's shape; non-scaling-stroke keeps
                 the lines hairline (matching the 1px border) either way. -->
            <svg
              v-if="item.unavailable"
              class="thumb-x"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                x1="0"
                y1="0"
                x2="100"
                y2="100"
                stroke="currentColor"
                stroke-width="1"
                vector-effect="non-scaling-stroke"
              />
              <line
                x1="0"
                y1="100"
                x2="100"
                y2="0"
                stroke="currentColor"
                stroke-width="1"
                vector-effect="non-scaling-stroke"
              />
            </svg>
          </span>

          <span class="sr-only">
            {{ colorName(item.doc.title)
            }}{{ item.live && !item.live.availableForSale ? ` — ${$t('product.outOfStock')}` : '' }}
          </span>
        </component>
      </li>
    </ul>
  </nav>
</template>

<script setup>
/**
 * The colorway group — separate Shopify products sharing a group:<slug> tag
 * (docs/shopify-and-localization-strategy.md §4). `items` = [{ doc, live,
 * current }], INCLUDING the product being viewed: current renders unlinked
 * with a stronger border (aria-current carries it for screen readers).
 *
 * Availability mirrors the grid card: live === null means not sold in this
 * market → dimmed and NOT linked; live but !availableForSale (sold out) →
 * dimmed, still linked (the sibling PDP renders its own sold-out state).
 */
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

// String names don't resolve components in dynamic :is at runtime —
// resolve NuxtLink explicitly.
const NuxtLink = resolveComponent('NuxtLink')
const localePath = useLocalePath()

// Editorial featuredImage first, Shopify's product image as the fallback —
// the same resolution the grid cards use, just at thumb width. `unavailable`
// covers both dimmed states: masked from the market OR sold out.
const productImage = useProductImage()
const entries = computed(() =>
  props.items.map((item) => ({
    ...item,
    image: productImage(item.doc, item.live, { w: 240 }),
    unavailable: !item.live || !item.live.availableForSale,
  })),
)

// "Speedy 01 · Grey" → "Grey"; titles without the separator show in full.
const colorName = (title = '') => (title.includes('·') ? title.split('·').pop().trim() : title)
</script>

<style scoped>
.colorways .label {
  color: var(--color-grey-6);
  margin-bottom: var(--spacing-xs);
}

.colorway-link {
  .thumb {
    position: relative;
    aspect-ratio: 3 / 2;
    border-radius: calc(var(--radius-def) / 2);
    overflow: hidden;
    border: 1px solid var(--color-grey-1);

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
    }

    .thumb-x {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      /* Same color as the thumb's border, so the cross reads as part of
         the frame rather than a badge. */
      color: var(--color-grey-1);
    }
  }

  &.is-unavailable {
    .thumb {
      opacity: 0.65;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--color-grey-1);
        opacity: 0.35;
      }
    }
  }

  &.is-current .thumb {
    border-color: var(--color-grey-7);
  }

  .name {
    margin-top: var(--spacing-xs);
    color: var(--color-grey-5);
  }
}
</style>
