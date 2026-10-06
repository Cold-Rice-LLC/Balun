import type { InjectionKey, Ref } from 'vue'

const leadModuleKey: InjectionKey<Ref<string | undefined>> = Symbol('leadModule')

/**
 * Which home module opens the page — its media is the likely LCP, so it
 * loads eagerly (still fading in; see the lazy-image contract in global.css)
 * while everything below stays lazy.
 *
 * The home page provides the first module's _key; media modules ask whether
 * they're it. Injected rather than passed as a prop so modules that don't
 * care never see it (an undeclared prop falls through onto their root as an
 * attribute). Outside the home page (info reuses Video) nothing is provided,
 * so it's always false there.
 */
export const provideLeadModule = (key: Ref<string | undefined>) => provide(leadModuleKey, key)

export const useIsLeadModule = (module: { _key?: string }) => {
  const leadKey = inject(leadModuleKey, null)
  return computed(() => !!module._key && leadKey?.value === module._key)
}
