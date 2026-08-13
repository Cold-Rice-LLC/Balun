<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator
    color="#a756a5"
    :height="5"
  />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
// <html lang> (and dir) follow the active locale — the BCP 47 `language`
// tags from locales.mjs (en-US, en-GB, es-US). seo:false because the
// hreflang/og:locale alternates it would add need an absolute i18n.baseUrl
// to be valid, and no production domain is configured yet — turning them on
// is step 1 of docs/launch-checklist.md.
const localeHead = useLocaleHead({ seo: false })
useHead(() => ({ htmlAttrs: localeHead.value.htmlAttrs }))
</script>
