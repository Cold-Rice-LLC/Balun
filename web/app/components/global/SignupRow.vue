<template>
  <!-- One underlined row: label, field, arrow. Shared by the footer signup
       (email, then phone) and the back-in-stock popup so they can't drift.
       The visible label doubles as the field's label; below lg (or always,
       with hide-label) it is sr-only rather than hidden, so the field keeps
       its name. -->
  <form
    class="signup-row flex items-center gap-x-sm"
    :class="{ 'label-shown': !hideLabel }"
    novalidate
    :aria-busy="sending"
    @submit.prevent="emit('submit')"
  >
    <label
      :for="inputId"
      class="text-base md:text-lg uppercase leading-none flex-none sr-only"
      :class="{ 'lg:not-sr-only': !hideLabel }"
      >{{ label }}</label
    >
    <input
      :id="inputId"
      ref="inputEl"
      v-model="value"
      :type="type"
      :name="name"
      :autocomplete="autocomplete"
      required
      :placeholder="placeholder"
      :disabled="sending"
      :aria-describedby="describedby"
      class="min-w-0 flex-1"
    />
    <!-- Honeypot (with v-model:honeypot): off-screen and hidden from
         assistive tech, so only a bot filling every field puts anything in
         it. The server treats a non-empty value as spam. -->
    <input
      v-if="honeypot !== null"
      v-model="honeypot"
      type="text"
      name="website"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
      class="sr-only"
    />
    <!-- Named by its visible word at every width: word + arrow below lg,
         the arrow alone from lg with the word kept as sr-only text. -->
    <button
      type="submit"
      :disabled="sending"
      class="text-base md:text-lg uppercase leading-none flex-none flex items-center gap-x-xs"
    >
      <span class="lg:sr-only">{{ submitLabel }}</span>
      <span aria-hidden="true">→</span>
    </button>
  </form>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  submitLabel: { type: String, required: true },
  type: { type: String, default: 'email' },
  name: { type: String, default: 'email' },
  autocomplete: { type: String, default: 'email' },
  sending: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
  hideLabel: { type: Boolean, default: false },
})

const emit = defineEmits(['submit'])
const value = defineModel({ type: String, default: '' })
const honeypot = defineModel('honeypot', { type: String, default: null })

const inputId = useId()
const inputEl = ref(null)
defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<style scoped>
/* The underline runs under the whole row; from lg, where a shown label
   joins the row, it's under the input alone. Text and underline take the
   surrounding text color. Text fields match :focus-visible on click as well
   as on Tab (the browser assumes typing follows), so the ring would box every
   click — the underline changes color instead (--signup-focus, set by the
   surface: light on the dark footer, dark on light panels), still a visible
   indicator. */
.signup-row {
  border-bottom: 2px solid currentColor;

  &:has(input:focus-visible) {
    border-color: var(--signup-focus, var(--color-grey-1));
  }

  &.label-shown {
    @media (width >= 1024px) {
      border-bottom: 0;
    }
  }

  input {
    color: inherit;
    text-transform: uppercase;

    &::placeholder {
      color: inherit;
    }

    &:focus-visible {
      outline: none;
      border-color: var(--signup-focus, var(--color-grey-1));
    }
  }

  &.label-shown input {
    @media (width >= 1024px) {
      border-bottom: 2px solid currentColor;
    }
  }
}

/* High contrast: the underline's focus color change is gone (the greys all
   turn the text color), so focus gets the site's ring back. */
html.high-contrast .signup-row input:focus-visible {
  outline: 0.2rem solid currentColor;
}
</style>
