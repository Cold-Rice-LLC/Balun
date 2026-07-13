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
export const CartObj = `
id
checkoutUrl
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


export const CreateCartQuery = `
mutation createCart($cartInput: CartInput) {
  cartCreate(input: $cartInput) {
    cart {
    	${CartObj}
    }
    userErrors {
      field
      message
    }
  }
}`


export const FetchCartQuery = `
	query ($id: ID!) {
		cart(id: $id) {
			${CartObj} 
		}
	}
`

export const AddLineItemsMutation = `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart {
      ${CartObj}
    }
    userErrors {
      field
      message
    }
  }
}`

export const UpdateLineItemsMutation = `mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
  cartLinesUpdate(cartId: $cartId, lines: $lines) {
    cart {
      ${CartObj}
    }
    userErrors {
      field
      message
    }
  }
}`

export const RemoveLineItemsMutation = `mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
    cart {
      ${CartObj}
    }
    userErrors {
      field
      message
    }
  }
}`

export const ApplyDiscountMutation = `mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]) {
  cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
    cart {
      ${CartObj} 
    }
    userErrors {
      field
      message
    }
  }
}`


export const FetchProductById = `
	query ($id: ID!) {
	  node(id: $id) {
	    ... on Product{
		    id
		    availableForSale
		    descriptionHtml
		    description
		    handle
		    productType
		    title
		    vendor
		    publishedAt
		    onlineStoreUrl
		    options {
		      name
		      values
		    }
		    images(first: 250) {
		      pageInfo {
		        hasNextPage
		        hasPreviousPage
		      }
		      edges {
		        cursor
		        node {
		          id
		          url
		          altText
		          width
		          height
		        }
		      }
		    }
		    variants(first: 250) {
		      pageInfo {
		        hasNextPage
		        hasPreviousPage
		      }
		      edges {
		        cursor
		        node {
		          id
		          title
		          price {
		            amount
		            currencyCode
		          }
		          availableForSale
		          compareAtPrice {
		            amount
		            currencyCode
		          }
		          image {
		            id
		            url
		          }
		          selectedOptions {
		            name
		            value
		          }
		          unitPrice {
		            amount
		            currencyCode
		          }
		          unitPriceMeasurement {
		            measuredType
		            quantityUnit
		            quantityValue
		            referenceUnit
		            referenceValue
		          }
		        }
		      }
		    }
		  }
		}
	}`

    export const FetchProductByHandle = `
	query ($handle: String!) {
	  productByHandle(handle: $handle) {
	    id
	    availableForSale
	    createdAt
	    updatedAt
	    descriptionHtml
	    description
	    handle
	    productType
	    title
	    vendor
	    publishedAt
	    onlineStoreUrl
	    options {
	      name
	      values
	    }
	    images(first: 250) {
	      pageInfo {
	        hasNextPage
	        hasPreviousPage
	      }
	      edges {
	        cursor
	        node {
	          id
	          url
	          altText
	          width
	          height
	        }
	      }
	    }
	    variants(first: 250) {
	      pageInfo {
	        hasNextPage
	        hasPreviousPage
	      }
	      edges {
	        cursor
	        node {
	          id
	          title
	          price {
	            amount
	            currencyCode
	          }
	          weight
	          availableForSale
	          sku
	          compareAtPrice {
	            amount
	            currencyCode
	          }
	          image {
	            id
	            url
	            altText
	            width
	            height
	          }
	          selectedOptions {
	            name
	            value
	          }
	          unitPrice {
	            amount
	            currencyCode
	          }
	          unitPriceMeasurement {
	            measuredType
	            quantityUnit
	            quantityValue
	            referenceUnit
	            referenceValue
	          }
	        }
	      }
	    }
	  }
	}`
