import { createContext } from '@lit/context'

const CART_SECTIONS_CONTEXT = 'shopify-cart-sections'
export const cartSectionsContext = createContext<CartSections>(
  CART_SECTIONS_CONTEXT
)

export type CartSections = Record<string, string | null>

export default cartSectionsContext
