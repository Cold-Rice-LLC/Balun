<template>
  <!-- Sits just above the bottom nav. The exit is a plain anchor: drafts were
       fetched on the server, so leaving preview takes a full reload. -->
  <p
    v-if="preview"
    role="status"
    class="fixed left-gutter bottom-[calc(var(--spacing-button-md-height)+var(--spacing-xs))] md:bottom-[calc(var(--spacing-button-lg-height)+var(--spacing-xs))] z-(--z-nav) flex items-center gap-xs px-sm py-xs rounded-full bg-yellow text-black text-sm"
  >
    {{ $t('preview.banner') }}
    <a
      :href="route.path"
      class="underline"
      >{{ $t('preview.exit') }}</a
    >
  </p>
</template>

<script setup>
// Shown only when the server really rendered drafts (plugins/preview.server.ts
// — not for ?preview=true without a token), and only while the URL still
// asks: a client-side navigation fetches published content and drops it.
const route = useRoute()
const active = useState('preview-active', () => false)
const preview = computed(() => active.value && route.query.preview === 'true')
</script>
