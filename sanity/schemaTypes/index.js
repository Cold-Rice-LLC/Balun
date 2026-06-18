import siteSettings from './siteSettings'
import blockContent from './objects/blockContent'
import product from './documents/product'
import feedPost from './documents/feedPost'
import homePage from './documents/homePage'
import infoPage from './documents/infoPage'
import feedPage from './documents/feedPage'
import livePage from './documents/livePage'

export const schemaTypes = [
  // Objects
  blockContent,
  // Singletons
  siteSettings,
  homePage,
  infoPage,
  feedPage,
  livePage,
  // Collections
  product,
  feedPost,
]
