<template>
  <NuxtLayout>
    <!-- 404: the editable message and home link (Site Settings → 404 Page),
         then the big "404 / PAGE NOT FOUND" graphic, the whole stack sitting
         on the bottom edge as in the mockup. The graphic says "page not
         found" to sighted visitors; the h1 says it to everyone else. -->
    <div
      v-if="isNotFound"
      class="h-svh flex flex-col justify-end items-center gap-y-sm overflow-hidden text-center"
    >
      <h1 class="sr-only">{{ $t('error.notFound') }}</h1>

      <p class="max-w-[52.4rem] px-gutter font-tertiary uppercase text-base md:text-lg leading-none text-grey-5">
        {{ settings?.notFoundMessage || $t('error.notFoundMessage') }}
      </p>

      <button
        class="font-tertiary uppercase text-base md:text-lg leading-none text-grey-5 mt-sm cursor-pointer hover:underline"
        @click="handleClearError"
      >
        {{ settings?.notFoundLinkLabel || $t('error.goHome') }}
      </button>

      <IconsNotFound class="w-[150%] md:w-full flex-none" />
    </div>

    <div
      v-else
      class="h-svh flex flex-col justify-center items-center gap-y-base text-center"
    >
      <p class="text-xs uppercase text-grey-4">{{ error?.statusCode || 500 }}</p>

      <h1 class="uppercase">{{ $t('error.generic') }}</h1>

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
const isNotFound = computed(() => props.error?.statusCode === 404)
const { data: settings } = await useSiteSettings()

useSeo(() => ({ title: t(isNotFound.value ? 'error.notFound' : 'error.generic'), noindex: true }))

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
