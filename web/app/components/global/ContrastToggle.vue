<template>
  <!-- Icon only; the name and on/off state are for screen readers. A bare
       icon in a pill-height box (the click target). -->
  <button
    v-if="enabled"
    type="button"
    class="contrast-toggle w-[3rem] aspect-square flex items-center justify-center text-grey-6 transition-colors duration-300"
    :aria-pressed="on"
    @click="toggle"
  >
    <span class="sr-only">{{ $t('contrast.label') }}</span>

    <IconsContrast class="w-[2.2rem]" />
  </button>
</template>

<script setup>
import { HIGH_CONTRAST_CLASS, HIGH_CONTRAST_KEY } from '~/composables/useHighContrast'

const { data: settings } = await useSiteSettings()
const enabled = computed(() => Boolean(settings.value?.highContrastToggle))
const { on, sync, toggle, disable } = useHighContrast()

// Pre-paint: the saved choice, else the device's "more contrast" setting.
// Only in the page while the Site Settings switch is on, so switching it off
// takes the mode away from everyone (from the next publish's re-render).
useHead(() => ({
  script: enabled.value
    ? [
        {
          key: 'high-contrast-gate',
          innerHTML:
            '(function(){var v;' +
            `try{v=localStorage.getItem('${HIGH_CONTRAST_KEY}')}catch(e){}` +
            "if(v==='high'||(v!=='standard'&&matchMedia('(prefers-contrast: more)').matches))" +
            `document.documentElement.classList.add('${HIGH_CONTRAST_CLASS}')})()`,
        },
      ]
    : [],
}))

// Pick up what the head script decided; and drop the mode if the switch
// goes off while someone is browsing (without touching their saved choice).
onMounted(() => {
  watch(
    enabled,
    (value) => {
      if (value) sync()
      else disable()
    },
    { immediate: true },
  )
})
</script>

<style scoped>
/* No fill behind it, so it takes a light grey on the grey and black page
   templates the fixed header floats over (high contrast turns either one
   to its context's text color). */
body.template-pdp .contrast-toggle,
body.template-info .contrast-toggle,
body.template-feed .contrast-toggle,
body.template-live .contrast-toggle {
  color: var(--color-grey-1);
}
</style>
