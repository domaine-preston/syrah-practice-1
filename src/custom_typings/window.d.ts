/// <reference path="./shopify.d.ts" />
interface Window {
  Shopify: {
    routes: {
      root: string
    }
    designMode: boolean
    PaymentButton?: {
      init: () => void
    }
  }

  routes: {
    cart_add_url: string
    cart_change_url: string
    cart_update_url: string
    predictive_search_url: string
  }

  __STOREFRONT_ACCESS_TOKEN__: string
  __CART__: ShopifyCart
}
