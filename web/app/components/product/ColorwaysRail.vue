<template>
  <nav
    v-if="items.length"
    class="colorways"
    aria-label="Colorways"
  >
    <p class="text-2xs uppercase label">Colorways</p>

    <ul class="flex flex-wrap gap-sm">
      <li
        v-for="item in items"
        :key="item.doc._id"
      >
        <NuxtLink
          :to="localePath(`/products/${item.doc.slug}`)"
          class="colorway-link block"
          :class="{ 'is-unavailable': !item.live }"
        >
          <span class="thumb block">
            <img
              v-if="item.live?.featuredImage"
              :src="item.live.featuredImage.url"
              :alt="item.live.featuredImage.altText || item.doc.title"
              loading="lazy"
            />
          </span>

          <span class="name block text-2xs uppercase text-center">{{
            colorName(item.doc.title)
          }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup>
/**
 * Sibling colorways — separate Shopify products sharing a group:<slug> tag
 * (docs/shopify-and-localization-strategy.md §4). `items` = [{ doc, live }];
 * live === null means not sold in this market → shown dimmed, still linked
 * (the sibling PDP renders its own unavailable state).
 */
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const localePath = useLocalePath()

// "Speedy 01 · Grey" → "Grey"; titles without the separator show in full.
const colorName = (title = '') =>
  title.includes('·') ? title.split('·').pop().trim() : title
</script>

<style scoped>
.colorways .label {
  color: var(--color-grey-6);
  margin-bottom: var(--spacing-xs);
}

.colorway-link {
  width: 5.6rem;

  &.is-unavailable {
    opacity: 0.45;
  }

  .thumb {
    aspect-ratio: 3 / 4;
    background-color: var(--color-grey-7);
    border-radius: calc(var(--radius-def) / 2);
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .name {
    margin-top: var(--spacing-xs);
    color: var(--color-grey-5);
  }
}
</style>
