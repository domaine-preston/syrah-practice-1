import BaseElement from '@/base/BaseElement'
import { WithShopifyCartClientMixin } from '@/mixins/WithShopifyCart'
import { html, nothing } from 'lit'

export class VariantsInCart extends WithShopifyCartClientMixin(BaseElement) {
  static get properties() {
    return {
      variantId: { type: Number, attribute: 'variant-id' },
      label: { type: String },
    }
  }

  label = '###quantity### in cart'

  get count() {
    return this.cart.items
      .filter((item) => item.variant_id === this.variantId)
      .reduce((acc, item) => acc + item.quantity, 0)
  }

  render() {
    if (!this.variantId) {
      return html`${nothing}`
    }

    return html`
      ${this.count > 0
        ? html`<span
            >(${this.label.replace('###quantity###', String(this.count))})</span
          >`
        : nothing}
    `
  }
}

window.customElements.define('variants-in-cart', VariantsInCart)
