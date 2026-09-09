import {AddIcon} from '@sanity/icons'
import {Box, Button, Flex} from '@sanity/ui'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {set, useFormValue} from 'sanity'

/**
 * Starter set of modules per feed post category, top to bottom. Seeded once
 * from the "Add defaults" button; `initialValue` can't do this because the
 * category isn't known when the document is created.
 */
const CATEGORY_DEFAULTS: Record<string, string[]> = {
  stream: ['moduleFeedText', 'moduleVideo'],
  products: ['moduleFeedText', 'moduleFeedLinks'],
  events: ['moduleFeedText', 'moduleFeedLinks'],
  blog: ['moduleFeedText', 'moduleFeedImage', 'moduleFeedText', 'moduleFeedLinks'],
}

const CATEGORY_TITLES: Record<string, string> = {
  stream: 'Stream',
  products: 'Products',
  events: 'Events',
  blog: 'Blog',
}

function randomKey() {
  return Math.random().toString(36).slice(2, 11)
}

// Items appended via `set` skip the schema's `initialValue`, so restate the
// ones that matter here. Translated fields are left empty — the
// internationalized-array plugin fills in the default language on render.
function makeModule(type: string) {
  const base = {_type: type, _key: randomKey()}
  switch (type) {
    case 'moduleVideo':
      return {...base, videoType: 'mp4'}
    case 'moduleFeedLinks':
      return {...base, links: [{_type: 'labeledLink', _key: randomKey(), linkType: 'internal'}]}
    default:
      return base
  }
}

/**
 * Array input for a feed post's Content. While the array is empty, offers an
 * "Add <Category> defaults" button that seeds the category's starter modules
 * (see CATEGORY_DEFAULTS). Once anything is in the array the button goes away
 * and the default array input takes over.
 */
export function FeedModulesInput(props: ArrayOfObjectsInputProps) {
  const category = useFormValue(['category']) as string | undefined
  const isEmpty = !props.value?.length
  const defaults = category ? CATEGORY_DEFAULTS[category] : undefined

  return (
    <Box>
      {isEmpty && defaults && (
        <Flex marginBottom={3}>
          <Button
            text={`Add ${CATEGORY_TITLES[category]} defaults`}
            tone="primary"
            mode="ghost"
            icon={AddIcon}
            onClick={() => props.onChange(set(defaults.map(makeModule)))}
          />
        </Flex>
      )}
      {props.renderDefault(props)}
    </Box>
  )
}
