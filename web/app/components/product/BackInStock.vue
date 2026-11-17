<template>
  <!-- The PDP's sold-out note: a text button in the price's style that opens
       the back-in-stock popup (BackInStockModal). -->
  <button
    type="button"
    class="mt-sm font-secondary text-grey-7 hover:underline"
    aria-haspopup="dialog"
    @click="open({ handle, title })"
  >
    {{ $t('backInStock.notify') }}
  </button>
</template>

<script setup>
/**
 * "Notify me when back in stock", under the price while the product is sold
 * out. The popup and the Klaviyo signup live in BackInStockModal
 * (docs/back-in-stock.md).
 */
defineProps({
  handle: { type: String, required: true },
  title: { type: String, required: true },
})

const { open } = useBackInStock()
</script>
