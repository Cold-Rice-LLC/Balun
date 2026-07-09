import siteSettings from './siteSettings'
import blockContent from './objects/blockContent'
import navLink from './objects/navLink'
import shopifyProduct from './objects/shopifyProduct'
import shopifyProductVariant from './objects/shopifyProductVariant'
import shopifyCollection from './objects/shopifyCollection'
import product from './documents/product'
import productVariant from './documents/productVariant'
import collection from './documents/collection'
import feedPost from './documents/feedPost'
import homePage from './documents/homePage'
import infoPage from './documents/infoPage'
import feedPage from './documents/feedPage'
import livePage from './documents/livePage'

export const schemaTypes = [
  // Objects
  blockContent,
  navLink,
  shopifyProduct,
  shopifyProductVariant,
  shopifyCollection,
  // Singletons
  siteSettings,
  homePage,
  infoPage,
  feedPage,
  livePage,
  // Collections
  product,
  productVariant,
  collection,
  feedPost,
]
