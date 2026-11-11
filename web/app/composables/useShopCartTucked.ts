// Home + the Site Settings switch ("Reveal Shop & Cart on Scroll"): the
// bottom shop/cart buttons stay out of view until the visitor scrolls past
// REVEAL_AT, and leave again back at the top. Never while a drawer is open
// (the cart button is its checkout). y is 0 on the server, so the cached
// shell already renders them tucked — no pop on load.
//
// Shared by everything that rests on those buttons: the nav itself, the
// closed cart drawer peeking under the cart button (768px+), and the featured
// product CTAs that sit one button-height up.
const REVEAL_AT = 40

export const useShopCartTucked = () => {
  const { data: settings } = useSiteSettings()
  const route = useRoute()
  const localePath = useLocalePath()
  const { isOpen: cartOpen } = useCart()
  const { isOpen: quickAddOpen } = useQuickAdd()
  const { y: scrollY } = useWindowScroll()

  const strip = (p: string) => p.replace(/\/+$/, '')

  // armed: this page tucks at all (lets followers match the nav's reveal
  // timing, not just its tucked state); tucked: out of view right now.
  const armed = computed(
    () => Boolean(settings.value?.homeRevealShopCart) && strip(route.path) === strip(localePath('/')),
  )
  const tucked = computed(() => armed.value && scrollY.value < REVEAL_AT && !cartOpen.value && !quickAddOpen.value)

  return { armed, tucked }
}
