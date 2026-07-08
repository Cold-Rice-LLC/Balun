<template>
  <NuxtLayout>
    <div class="h-svh flex flex-col justify-center items-center gap-y-base text-center">
      <p class="text-xs uppercase text-grey-4">{{ error?.statusCode || 500 }}</p>

      <h1 class="uppercase">{{ message }}</h1>

      <button
        class="home-button uppercase text-xs bg-yellow"
        @click="handleClearError"
      >
        Back to home
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

const message = computed(() =>
  props.error?.statusCode === 404 ? 'Page not found' : 'Something went wrong',
)

// The error page renders outside the normal page lifecycle, so the router's
// scroll-to-top behavior never fires — do it ourselves.
onMounted(() => window.scrollTo(0, 0))

// Clears the error state and navigates home — a plain nuxt-link would leave
// the error page mounted.
const handleClearError = () => clearError({ redirect: '/' })
</script>

<style scoped>
.home-button {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: calc(infinity * 1px);
  cursor: pointer;
}
</style>
