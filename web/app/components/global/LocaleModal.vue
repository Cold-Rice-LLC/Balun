<template>
  <button
    type="button"
    class="trigger text-lg leading-none"
    :aria-label="label"
    aria-haspopup="dialog"
    :aria-expanded="open"
    @click="open = true"
  >
    <IconsGlobe />
    <span>{{ currentName }}</span>
  </button>

  <!-- Teleported: the footer wraps its content in pointer-events/overflow
       rules that a fixed overlay shouldn't inherit. -->
  <Teleport to="body">
    <button
      class="locale-backdrop"
      :class="{ active: open }"
      tabindex="-1"
      @click="open = false"
    >
      <span class="sr-only">Close {{ label.toLowerCase() }} picker</span>
    </button>

    <div
      class="locale-modal uppercase"
      :class="{ active: open }"
      role="dialog"
      aria-modal="true"
      :aria-label="label"
    >
      <p class="modal-label text-sm">{{ label }}</p>

      <ul
        class="text-lg"
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
  </Teleport>
</template>

<script setup>
/**
 * Presentational modal for a locale switcher (market or language). `items`
 * are { name, code, active }; each option is a nuxt-link to switchLocalePath so
 * navigation stays real links (prefetch/SEO), not JS-driven. The trigger opens
 * a centered grey panel over a blurred backdrop (same pattern as the cart and
 * quick-add overlays); closes on backdrop click, Escape, or selection.
 */
const props = defineProps({
  label: { type: String, required: true },
  items: { type: Array, default: () => [] },
})

const switchLocalePath = useSwitchLocalePath()
const open = ref(false)

const currentName = computed(() => props.items.find((i) => i.active)?.name ?? props.items[0]?.name ?? '')

const onKey = (e) => {
  if (e.key === 'Escape') open.value = false
}

useScrollLock(open)

onMounted(() => {
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-grey-4);
  cursor: pointer;
  transition: color 0.3s;
  pointer-events: auto;
  text-transform: uppercase;

  &:hover,
  &[aria-expanded='true'] {
    color: var(--color-grey-7);
  }

  svg {
    width: 2.3rem;
  }

  span {
    flex: none;
  }
}

/* Same backdrop treatment as the cart/quick-add overlays, but layered above
   the MainNav header (z 5000) — a modal covers everything. */
.locale-backdrop {
  position: fixed;
  inset: 0;
  z-index: 5100;
  background-color: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(6px);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;

  &.active {
    opacity: 1;
    pointer-events: auto;
  }
}

.locale-modal {
  position: fixed;
  z-index: 5200;
  top: 50%;
  left: 50%;
  min-width: 24rem;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  background-color: var(--color-grey-1);
  border-radius: var(--radius-def);
  color: var(--color-grey-6);
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 0.3s;
  pointer-events: none;

  &.active {
    opacity: 1;
    pointer-events: auto;
  }
}

.modal-label {
  color: var(--color-grey-5);
}

ul {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  line-height: 1;

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
