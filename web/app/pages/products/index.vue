<template>
  <div class="pt-page-top pb-base enter-in-fade-up">
    <h1 class="sr-only">{{ $t('meta.shop') }}</h1>

    <HomeProductGrid
      v-if="products.length"
      :module="{ products }"
      :live-by-gid="liveByGid"
    />

    <p
      v-else
      class="px-base py-base font-quaternary text-xs text-grey-5"
    >
      {{ $t('shop.empty') }}
    </p>
  </div>
</template>

<script setup>
/**
 * The Shop page: every product on sale, in the order the Shop Page document
 * lists them (per market, like home), as the home Product Grid's cards. The
 * secondary nav's Shop link lands here.
 */
import { shopQuery } from '~/utils/queries'

const { t } = useI18n()
const { data: page } = await useMarketPage('shop', shopQuery)

const products = computed(() => page.value?.products ?? [])
const liveByGid = useLiveProducts(() => products.value.map((p) => p.gid).filter(Boolean))

useSeo(() => ({ seo: page.value?.seo, title: t('meta.shop') }))

useHead({
  bodyAttrs: { class: 'template-shop' },
})
</script>
