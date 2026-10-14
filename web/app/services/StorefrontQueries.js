/**
 * Raw GraphQL strings for the Storefront API, used by useShopifyClient (cart)
 * — plain JS exports, imported manually (services/ is not a Nuxt auto-import dir).
 *
 * CartObj is the shared cart projection interpolated into every cart
 * query/mutation so they all return the same shape (lines, costs, discounts,
 * checkoutUrl). Mutations return `userErrors` — check it before trusting `cart`.
 *
 * The two product queries at the bottom are heavyweight PDP-style fetches
 * (250 variants/images). Listing/buy-box reads use the lean cached
 * /api/products route instead — see server/api/products.get.ts.
 */
const CartObj = `
id
checkoutUrl
buyerIdentity{
  countryCode
}
lines(first:30){
  nodes{
    ...on CartLine{
      id
      quantity
	  discountAllocations{
	 	discountedAmount{
			amount
			currencyCode
		} 
	  }
	  cost {
		totalAmount {
			amount
			currencyCode
		}
		subtotalAmount {
			amount
			currencyCode
		}
	  }
      merchandise{
        ... on ProductVariant{
          id
          title
          image{
            url
          }
          price{
            amount
            currencyCode
          }
		  compareAtPrice{
            amount
            currencyCode
          }
		  image {
			url
			altText
		  }
          product{
            title
            id
			handle
			featuredImage {
				url
				altText
			}
          }
        }
      }
    }
  }
}
discountAllocations{
  discountApplication{
    value {
      ... on MoneyV2 {
        __typename
        amount
        currencyCode
      }
      ... on PricingPercentageValue {
        __typename
        percentage
      }
    }
  }  
}
discountCodes{
  applicable
  code
}
cost {
	checkoutChargeAmount {
		amount
		currencyCode
	}
  subtotalAmount { 
    amount
    currencyCode
  }
  totalAmount {
    amount
    currencyCode
  }
}`


// What every cart mutation returns: the updated cart, plus Shopify's
// "couldn't do that" reasons (sold out, dead cart), which arrive as
// userErrors rather than a thrown request.
const CartMutationPayload = `
    cart {
      ${CartObj}
    }
    userErrors {
      field
      message
    }`

// Every cart operation carries @inContext(language:) so the returned cart
// (line titles etc.) AND the checkoutUrl are localized consistently — doing it
// on only some ops would leave the drawer flipping language depending on which
// mutation last ran. $language is nullable: omitted = store default language.
export const CreateCartQuery = `
mutation createCart($cartInput: CartInput, $language: LanguageCode) @inContext(language: $language) {
  cartCreate(input: $cartInput) {
    ${CartMutationPayload}
  }
}`


export const FetchCartQuery = `
	query ($id: ID!, $language: LanguageCode) @inContext(language: $language) {
		cart(id: $id) {
			${CartObj}
		}
	}
`

export const AddLineItemsMutation = `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, $language: LanguageCode) @inContext(language: $language) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    ${CartMutationPayload}
  }
}`

export const UpdateLineItemsMutation = `mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!, $language: LanguageCode) @inContext(language: $language) {
  cartLinesUpdate(cartId: $cartId, lines: $lines) {
    ${CartMutationPayload}
  }
}`

export const RemoveLineItemsMutation = `mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!, $language: LanguageCode) @inContext(language: $language) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
    ${CartMutationPayload}
  }
}`

// Re-points an existing cart at another market: Shopify reprices every line,
// the totals, and checkoutUrl in the new country's currency. This is what
// keeps a persisted cart honest when the market switcher changes the URL.
export const UpdateBuyerIdentityMutation = `mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!, $language: LanguageCode) @inContext(language: $language) {
  cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
    ${CartMutationPayload}
  }
}`
