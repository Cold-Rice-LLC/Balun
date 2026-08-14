import siteSettings from './siteSettings'
import blockContent from './objects/blockContent'
import navLink from './objects/navLink'
import shopifyProduct from './objects/shopifyProduct'
import shopifyProductVariant from './objects/shopifyProductVariant'
import shopifyCollection from './objects/shopifyCollection'
import moduleProductGrid from './objects/moduleProductGrid'
import moduleFeaturedProduct from './objects/moduleFeaturedProduct'
import moduleMarquee from './objects/moduleMarquee'
import moduleBigImageLogo from './objects/moduleBigImageLogo'
import moduleBigImageHeadline from './objects/moduleBigImageHeadline'
import moduleHeadlineOverImage from './objects/moduleHeadlineOverImage'
import moduleVideo from './objects/moduleVideo'
import moduleInfoText from './objects/moduleInfoText'
import moduleInfoImage from './objects/moduleInfoImage'
import moduleInfoProse from './objects/moduleInfoProse'
import linkTarget from './objects/linkTarget'
import featureImage from './objects/featureImage'
import proseContent from './objects/proseContent'
import product from './documents/product'
import productVariant from './documents/productVariant'
import collection from './documents/collection'
import feedPost from './documents/feedPost'
import homePage from './documents/homePage'
import legalPage from './documents/legalPage'
import infoPage from './documents/infoPage'
import feedPage from './documents/feedPage'
import livePage from './documents/livePage'

export const schemaTypes = [
  // Objects
  blockContent,
  proseContent,
  navLink,
  shopifyProduct,
  shopifyProductVariant,
  shopifyCollection,
  featureImage,
  // Home page modules (page builder)
  moduleProductGrid,
  moduleFeaturedProduct,
  moduleMarquee,
  moduleBigImageLogo,
  moduleBigImageHeadline,
  moduleHeadlineOverImage,
  moduleVideo,
  // Info page modules (page builder)
  moduleInfoText,
  moduleInfoImage,
  moduleInfoProse,
  linkTarget,
  // Singletons
  siteSettings,
  homePage,
  legalPage,
  infoPage,
  feedPage,
  livePage,
  // Collections
  product,
  productVariant,
  collection,
  feedPost,
]
