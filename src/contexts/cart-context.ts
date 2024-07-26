import type { ShopifyCart } from '@/custom_typings/shopify'
import { createContext } from '@lit/context'

const CART_CONTEXT = 'shopify-cart'
export const cartContext = createContext<ShopifyCart>(CART_CONTEXT)

export default cartContext
