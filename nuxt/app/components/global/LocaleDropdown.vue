<template>
  <div
    ref="root"
    class="locale-dropdown text-sm uppercase"
  >
    <button
      type="button"
      class="trigger"
      :aria-label="label"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span>{{ currentName }}</span>
      <span
        class="caret"
        :class="{ open }"
        aria-hidden="true"
        >▾</span
      >
    </button>

    <ul
      v-if="open"
      class="menu"
      role="listbox"
      :aria-label="label"
    >
      <li
        v-for="item in items"
        :key="item.code"
        role="option"
        :aria-selected="item.active"
      >
        <nuxt-link
          :to="switchLocalePath(item.code)"
          :class="{ 'is-active': item.active }"
          @click="open = false"
        >
          {{ item.name }}
        </nuxt-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
/**
 * Presentational dropdown for a locale switcher (market or language). `items`
 * are { name, code, active }; each option is a nuxt-link to switchLocalePath so
 * navigation stays real links (prefetch/SEO), not JS-driven. Closes on outside
 * click, Escape, or selection.
 */
const props = defineProps({
  label: { type: String, required: true },
  items: { type: Array, default: () => [] },
})

const switchLocalePath = useSwitchLocalePath()
const open = ref(false)
const root = ref(null)

const currentName = computed(() => props.items.find((i) => i.active)?.name ?? props.items[0]?.name ?? '')

const onPointerDown = (e) => {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false
}
const onKey = (e) => {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.locale-dropdown {
  position: relative;
}

.trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-grey-4);
  cursor: pointer;
  transition: color 0.2s;

  &:hover,
  &[aria-expanded='true'] {
    color: var(--color-grey-3);
  }
}

.caret {
  transition: transform 0.2s;

  &.open {
    transform: rotate(180deg);
  }
}

.menu {
  position: absolute;
  top: calc(100% + var(--spacing-xs));
  left: 0;
  z-index: 10;
  min-width: max-content;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background-color: var(--color-grey-1);
  border-radius: calc(var(--radius-def) / 2);
  color: var(--color-grey-6);

  a {
    display: block;
    white-space: nowrap;
    transition: color 0.2s;

    &:hover {
      color: var(--color-grey-7);
    }

    &.is-active {
      color: var(--color-grey-7);
      text-decoration: underline;
      text-underline-offset: 0.3em;
    }
  }
}
</style>
