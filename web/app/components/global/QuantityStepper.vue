<template>
  <div class="stepper">
    <button
      :aria-label="$t('stepper.decrease')"
      :disabled="disabled"
      @click="step(-1)"
    >
      −
    </button>
    <span class="qty">{{ modelValue }}</span>
    <button
      :aria-label="$t('stepper.increase')"
      :disabled="disabled"
      @click="step(1)"
    >
      +
    </button>
  </div>
</template>

<script setup>
/**
 * Quantity stepper (− n +) shared by the cart lines and the quick-add drawer.
 * Presentational: emits the next value via v-model and lets the parent decide
 * what a change means (a local ref in quick-add, a Storefront line mutation in
 * the cart). `min` floors the decrement — the cart passes 0 so stepping below
 * 1 can become a remove. Font size comes from the parent (pass a text-* class).
 */
const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const step = (delta) => {
  const next = Math.max(props.min, props.modelValue + delta)
  if (next !== props.modelValue) emit('update:modelValue', next)
}
</script>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);

  button {
    line-height: 1;
    background-color: var(--color-grey-2);
    border-radius: 50%;
    width: 2.4rem;
    height: 2.4rem;
  }

  .qty {
    width: 1.5rem;
    text-align: center;
  }
}
</style>
