<template>
  <!-- Nothing above the footer: the page is one screen tall, and the
       footer (with its email signup) sits at the bottom of it, above the
       shop and cart buttons. See the template-newsletter rules in
       global.css and MainFooter. The heading names the page for screen
       readers and the skip link's target. -->
  <h1 class="sr-only">{{ $t('meta.newsletter') }}</h1>
</template>

<script setup>
/**
 * /newsletter (bare /newsletter redirects to /en-us/newsletter, see
 * routeRules): a link-in-bio / QR landing that's just the footer's email
 * signup on the yellow page.
 */
const { t } = useI18n()

useSeo(() => ({ title: t('meta.newsletter') }))

useHead({
  bodyAttrs: { class: 'template-newsletter' },
})
</script>
