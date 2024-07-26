import BaseElement from '@/base/BaseElement'
import { WithShopifyCartClientMixin } from '@/mixins/WithShopifyCart'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('cart-remove-toggle')
export class CartRemoveToggle extends WithShopifyCartClientMixin(BaseElement) {
  @property({ type: String })
  key!: string

  _handleClick(event: Event) {
    event.preventDefault()
    if (!this.key) return

    this.removeItemFromCart([this.key])
  }

  render() {
    return html` <slot @click=${this._handleClick}></slot> `
  }
}
