<template>
  <button
    v-if="live?.availableForSale"
    class="quick-add-trigger text-base"
    :class="{ 'is-pending': pendingOpen }"
    :aria-label="$t('quickAdd.trigger', { title: live.title })"
    aria-haspopup="dialog"
    aria-controls="quick-add-drawer"
    @click.stop.prevent="open({ doc, live })"
  >
    <slot>+</slot>
  </button>
</template>

<script setup>
/**
 * Drop-in quick-add opener for any product surface. Owns the behavior:
 * renders nothing unless the product is live and purchasable, wires the aria
 * relationship to the drawer, stops the click from following the card link
 * around it, and hands the drawer its { doc, live } payload.
 *
 * The "+" pill below is only the default design. Per-surface looks are
 * expected: a class set on this component lands on the button root, so the
 * caller's scoped CSS can restyle it (that's also how positioning is done —
 * always the caller's job), and the slot replaces the "+" content entirely.
 */
const props = defineProps({
  // Sanity editorial doc — unread by the drawer today, but part of the
  // payload contract so future drawer needs don't touch every trigger site.
  doc: { type: Object, default: null },
  live: { type: Object, default: null },
})

// Destructured so pendingOpen unwraps in the template (a `quickAdd.pendingOpen`
// member expression yields the Ref itself, which is always truthy).
const { open, pendingOpen } = useQuickAdd()
</script>

<style scoped>
.quick-add-trigger {
  width: 3.6rem;
  height: 3.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: calc(infinity * 1px);
  background-color: var(--color-white);
  color: var(--color-grey-6);
  line-height: 1;
  transition:
    background-color 0.2s,
    color 0.2s;

  &:hover {
    background-color: var(--color-yellow);
    color: var(--color-black);
  }

  /* The drawer is holding its reveal for the variants fetch — mirror the
     cart controls' in-flight feedback. Custom over Tailwind's
     cursor-progress: global.css's unlayered `button { cursor: pointer }`
     outranks layered utilities. */
  &.is-pending {
    cursor: progress;
  }
}
</style>
