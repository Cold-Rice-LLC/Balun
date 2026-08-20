<template>
  <NuxtLayout>
    <div class="h-svh flex flex-col justify-center items-center gap-y-base text-center">
      <p class="text-xs uppercase text-grey-4">{{ error?.statusCode || 500 }}</p>

      <h1 class="uppercase">{{ message }}</h1>

      <button
        class="home-button uppercase text-xs bg-yellow"
        @click="handleClearError"
      >
        {{ $t('error.backHome') }}
      </button>
    </div>
  </NuxtLayout>
</template>

<script setup>
const props = defineProps({
  error: {
    type: Object,
    default: null,
  },
})

const { t } = useI18n()
const message = computed(() => (props.error?.statusCode === 404 ? t('error.notFound') : t('error.generic')))

// The error page renders outside the normal page lifecycle, so the router's
// scroll-to-top behavior never fires — do it ourselves.
onMounted(() => window.scrollTo(0, 0))

// Clears the error state and navigates home — a plain nuxt-link would leave
// the error page mounted. Redirect keeps the visitor's market prefix.
const localePath = useLocalePath()
const handleClearError = () => clearError({ redirect: localePath('/') })
</script>

<style scoped>
.home-button {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: calc(infinity * 1px);
  cursor: pointer;
}
</style>
