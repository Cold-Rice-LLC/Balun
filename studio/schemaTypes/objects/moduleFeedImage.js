import {imageModule} from '../lib/fields'

/**
 * Feed detail module: a single full-width image. (Video is the shared
 * click-to-play `moduleVideo`, offered alongside this in the post's modules.)
 */
export default imageModule({
  name: 'moduleFeedImage',
  imageDescription: 'Shown at the full width of the post, at its own aspect ratio.',
})
