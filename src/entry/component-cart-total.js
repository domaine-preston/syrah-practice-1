import BaseElement from '@/base/BaseElement'
import { WithShopifyCartClientMixin } from '@/mixins/WithShopifyCart'
import { html, nothing } from 'lit'

export class CartTotal extends WithShopifyCartClientMixin(BaseElement) {
  static get properties() {
    return {
      translation: { type: Object },
    }
  }

  translation = {}

  get translatedCartCount() {
    return this.translation?.cart_count || '###count### items in your cart'
  }

  render() {
    return html`
      ${this.cart.item_count > 99
        ? nothing
        : html` <span aria-hidden="true">${this.cart.item_count}</span> `}
      <span class="sr-only"
        >${this.translatedCartCount.replace(
          '###count###',
          String(this.cart.item_count)
        )}</span
      >
    `
  }
}

window.customElements.define('cart-total', CartTotal)
