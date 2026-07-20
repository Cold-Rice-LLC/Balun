<template>
  <!-- Only render when the current market actually offers a choice — a lone
       language (e.g. UK = English only) needs no picker. -->
  <LocaleModal
    v-if="languages.length > 1"
    label="Language"
    :items="languages"
  />
</template>

<script setup>
/**
 * Language switcher: swaps the language half of the /{lang}-{country} URL
 * prefix, listing only languages supported for the current market. Content
 * follows via $lang (Sanity i18n fields + Shopify @inContext language).
 */
const { languages } = useLocaleNav()
</script>
