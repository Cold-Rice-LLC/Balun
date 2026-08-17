import { createStorefrontApiClient } from '@shopify/storefront-api-client';
import { CreateCartQuery, FetchProductById, FetchCartQuery, AddLineItemsMutation, UpdateLineItemsMutation, RemoveLineItemsMutation, UpdateBuyerIdentityMutation } from '@/services/StorefrontQueries';

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
 * Markets: a cart's currency is pinned to its buyerIdentity.countryCode, not
 * to the URL — CreateCart sets it, and useCart re-syncs it via
 * UpdateBuyerIdentity whenever the market switches (or a persisted cart comes
 * back from a session in another market).
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

    async function CreateCart(items = [], countryCode = null, language = null) {

            try{

                // buyerIdentity.countryCode sets the cart's market, so prices
                // and hosted checkout use the visitor's currency (Shopify Markets).
                // @inContext(language:) localizes line titles + hosted checkout.
                let cartInput = {
                    lines: items,
                    ...(countryCode ? { buyerIdentity: { countryCode } } : {}),
                }


                const { data } = await client.request(CreateCartQuery, {
                    variables: {
                        cartInput: cartInput,
                        language: language || undefined
                    }
                })

                // Keep the cart even on userErrors (it may exist, just without
                // the failed line), but honor the null-on-failure contract —
                // Shopify reports "couldn't add" via userErrors, not a throw.
                Cart.value = data?.cartCreate?.cart || null;
                if (data?.cartCreate?.cart?.id) {
                    localStorage.setItem('balunCartId', data.cartCreate.cart.id)
                }
                if (data?.cartCreate?.userErrors?.length) {
                    console.error('CreateCart userErrors', data.cartCreate.userErrors)
                    return null
                }
                return data?.cartCreate?.cart
            }catch(e){
                console.error('CreateCart failed', e)
                return null
            }
        }

    async function FetchCart(cartId = null, checkLocalStorage = false, language = null) {

        const id = checkLocalStorage ? localStorage.getItem('balunCartId') : cartId;
        if (!id) return null;

        try{
            const { data } = await client.request(FetchCartQuery, {
                variables: {
                    id: id,
                    language: language || undefined
                }
            })

            // A stored id resolving to no cart is dead (expired, or its
            // checkout completed) — forget it so the next add creates a
            // fresh cart instead of failing forever. Only on a real "no
            // such cart" response: a thrown request (network) skips this.
            if (!data?.cart && id === localStorage.getItem('balunCartId')) {
                localStorage.removeItem('balunCartId')
            }

            Cart.value = data?.cart || null;

            return data?.cart
        }catch(e){
            console.error('FetchCart failed', e)
            return null
        }
    }


    async function AddToCart(variantId, quantity, countryCode = null, language = null) {

        // check if cart Id exists
        const cartId = localStorage.getItem('balunCartId')

        if(cartId || Cart.value?.id){
            const id = cartId || Cart.value?.id;
            const result = await AddLineItems(id, [{ merchandiseId: variantId, quantity: quantity }], language)
            if (result) return result
            // The add failed — find out whether the cart itself is gone
            // (expired, or its checkout completed; Shopify then rejects the
            // id with "cart does not exist" userErrors forever). If so,
            // forget it and retry on a fresh cart. A cart that's alive but
            // refused the line (sold out) stays a real failure.
            const existing = await FetchCart(id, false, language)
            if (existing) return null
            localStorage.removeItem('balunCartId')
            return await CreateCart([{ merchandiseId: variantId, quantity: quantity }], countryCode, language)
        }else{
            // create new cart if no Id exists
            return await CreateCart([{ merchandiseId: variantId, quantity: quantity }], countryCode, language)
        }

    }

    async function AddLineItems(cartId, items = [], language = null) {

        try{
            const { data } = await client.request(AddLineItemsMutation, {
                variables: {
                    cartId: cartId,
                    lines: items,
                    language: language || undefined
                }
            })
            // Shopify signals "couldn't add" (e.g. variant sold out) via
            // userErrors WITH a truthy, unchanged cart — return null per this
            // module's contract, and don't clobber Cart state with it.
            if (data?.cartLinesAdd?.userErrors?.length) {
                console.error('AddLineItems userErrors', data.cartLinesAdd.userErrors)
                return null
            }
            Cart.value = data?.cartLinesAdd?.cart || null;
            return data?.cartLinesAdd?.cart
        }catch(e){
            console.error('AddLineItems failed', e)
            return null
        }
    }

    async function UpdateLineItems(cartId, items = [], language = null) {
        try{
            const { data } = await client.request(UpdateLineItemsMutation, {
                variables: {
                    cartId: cartId,
                    lines: items,
                    language: language || undefined
                }
            })
            Cart.value = data?.cartLinesUpdate?.cart || null;
            return data?.cartLinesUpdate?.cart
        }catch(e){
            console.error('UpdateLineItems failed', e)
            return null
        }
    }

    async function RemoveLineItems(cartId, items = [], language = null) {
        try{
            const { data } = await client.request(RemoveLineItemsMutation, {
                variables: {
                    cartId: cartId,
                    lineIds: items,
                    language: language || undefined
                }
            })

            Cart.value = data?.cartLinesRemove?.cart || null;

            return data?.cartLinesRemove?.cart
        }catch(e){
            console.error('RemoveLineItems failed', e)
            return null
        }
    }

    async function UpdateBuyerIdentity(cartId, countryCode, language = null) {
        try{
            const { data } = await client.request(UpdateBuyerIdentityMutation, {
                variables: {
                    cartId: cartId,
                    buyerIdentity: { countryCode },
                    language: language || undefined
                }
            })
            // On userErrors keep the current Cart state — the cart still
            // exists in its previous market; don't clobber it with the
            // failed response.
            if (data?.cartBuyerIdentityUpdate?.userErrors?.length) {
                console.error('UpdateBuyerIdentity userErrors', data.cartBuyerIdentityUpdate.userErrors)
                return null
            }
            Cart.value = data?.cartBuyerIdentityUpdate?.cart || null;
            return data?.cartBuyerIdentityUpdate?.cart
        }catch(e){
            console.error('UpdateBuyerIdentity failed', e)
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


    return { Cart, CreateCart, FetchCart, AddLineItems, UpdateLineItems, RemoveLineItems, UpdateBuyerIdentity, GetShopifyProduct, CurrencyFormatter, AddToCart, TotalCartItems }

}