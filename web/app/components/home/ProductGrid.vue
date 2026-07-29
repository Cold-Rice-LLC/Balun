<template>
  <section class="product-grid-module grid grid-cols-2 md:grid-cols-3 gap-base">
    <!-- Animation on this stable wrapper (not ProductCard): the card root
         swaps div → NuxtLink once live data hydrates, which would remount and
         restart the animation. -->
    <div
      v-for="(product, index) in products"
      :key="product._id"
      :style="{ animationDelay: `${index * 0.05}s` }"
    >
      <ProductCard
        :doc="product"
        :live="liveByGid[product.gid] ?? null"
      />
    </div>
  </section>
</template>

<script setup>
/**
 * Home module: product grid. `module.products` are Sanity editorial docs;
 * `liveByGid` maps Shopify gid → live market-priced product (hydrated client-
 * side by the page), passed to each card for price/availability.
 */
const props = defineProps({
  module: { type: Object, required: true },
  liveByGid: { type: Object, default: () => ({}) },
})

const products = computed(() => props.module.products ?? [])
</script>
