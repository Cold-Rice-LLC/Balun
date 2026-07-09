import { createStorefrontApiClient } from '@shopify/storefront-api-client';
import { CreateCartQuery, FetchProductById, FetchCartQuery, AddLineItemsMutation, UpdateLineItemsMutation, RemoveLineItemsMutation } from '@/services/StorefrontQueries';

/**
 * Client-side Shopify layer for CART operations (create/fetch/add/update/remove).
 *
 * Talks to the Storefront API directly from the browser — correct for carts,
 * which are per-user and uncacheable, so a server hop would add latency for
 * nothing. PRODUCT READS should NOT go through here: they belong on the
 * cached server route (/api/products via useShopifyProducts) so drop-day
 * traffic is absorbed server-side. GetShopifyProduct below is legacy-ish and
 * only for one-off cases the cached route doesn't cover.
 *
 * State: `Cart` is shared app-wide via useState('cart'); the cart id persists
 * across sessions in localStorage ('balunCartId'). AddToCart handles the
 * "cart exists?" branching — components should mostly just call AddToCart.
 *
 * All functions return null on failure (and console.error the cause).
 *
 * TODO(cart pass): pass buyerIdentity { countryCode } on CreateCart so
 * checkout opens in the visitor's market/currency (Shopify Markets), wire
 * the SecondaryNav cart button to Cart/TotalCartItems, and send the user to
 * cart.checkoutUrl for Shopify-hosted checkout.
 */
export const useShopifyClient = () => {

    const config = useRuntimeConfig();
    const Cart = useState('cart', () => null);

    // const headers = useRequestHeaders(['cookie'])

    const endpoint = config.public.shopifyStoreDomain
    const storefrontAccessToken = config.public.shopifyStorefrontAccessToken

    const client = createStorefrontApiClient({
    storeDomain: endpoint,
    apiVersion: '2026-04',
    publicAccessToken: storefrontAccessToken,
    });

    async function CreateCart(items = []) {

            try{

                let cartInput = {
                    lines: items
                }


                const { data } = await client.request(CreateCartQuery, {
                    variables: {
                        cartInput: cartInput
                    }
                })

                Cart.value = data?.cartCreate?.cart || null;
                if (data?.cartCreate?.cart?.id) {
                    localStorage.setItem('balunCartId', data.cartCreate.cart.id)
                }
                return data?.cartCreate?.cart
            }catch(e){
                console.error('CreateCart failed', e)
                return null
            }
        }

    async function FetchCart(cartId = null, checkLocalStorage = false) {

        const id = checkLocalStorage ? localStorage.getItem('balunCartId') : cartId;
        if (!id) return null;

        try{
            const { data } = await client.request(FetchCartQuery, {
                variables: {
                    id: id
                }
            })

            Cart.value = data?.cart || null;

            return data?.cart
        }catch(e){
            console.error('FetchCart failed', e)
            return null
        }
    }


    async function AddToCart(variantId, quantity) {

        // check if cart Id exists
        const cartId = localStorage.getItem('balunCartId')

        if(cartId || Cart.value?.id){
            const id = cartId || Cart.value?.id;
            return await AddLineItems(id, [{ merchandiseId: variantId, quantity: quantity }])
        }else{
            // create new cart if no Id exists
            return await CreateCart([{ merchandiseId: variantId, quantity: quantity }])
        }

    }

    async function AddLineItems(cartId, items = []) {

        try{
            const { data } = await client.request(AddLineItemsMutation, {
                variables: {
                    cartId: cartId, 
                    lines: items
                }
            })
            Cart.value = data?.cartLinesAdd?.cart || null;
            return data?.cartLinesAdd?.cart
        }catch(e){
            console.error('AddLineItems failed', e)
            return null
        }
    }

    async function UpdateLineItems(cartId, items = []) {
        try{
            const { data } = await client.request(UpdateLineItemsMutation, {
                variables: {
                    cartId: cartId,
                    lines: items
                }
            })
            Cart.value = data?.cartLinesUpdate?.cart || null;
            return data?.cartLinesUpdate?.cart
        }catch(e){
            console.error('UpdateLineItems failed', e)
            return null
        }
    }

    async function RemoveLineItems(cartId, items = []) {
        try{
            const { data } = await client.request(RemoveLineItemsMutation, {
                variables: {
                    cartId: cartId,
                    lineIds: items
                }
            })

            Cart.value = data?.cartLinesRemove?.cart || null;

            return data?.cartLinesRemove?.cart
        }catch(e){
            console.error('RemoveLineItems failed', e)
            return null
        }
    }

    async function GetShopifyProduct(id) {
        try{
            
            const { data } = await client.request(FetchProductById, {
                variables: {
                    id: id
                }
            })

            return data
        }catch(e){
            console.error('GetShopifyProduct failed', e)
            return null
        }
    }

    function TotalCartItems() {
        if(!Cart.value) return 0;
        return Cart.value.lines?.nodes?.reduce((total, line) => total + line.quantity, 0);
    }


    const CurrencyFormatter = (value, currency = 'USD') => {
        if(!value) return null;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
    }


    return { Cart, CreateCart, FetchCart, AddLineItems, UpdateLineItems, RemoveLineItems, GetShopifyProduct, CurrencyFormatter, AddToCart, TotalCartItems }

}