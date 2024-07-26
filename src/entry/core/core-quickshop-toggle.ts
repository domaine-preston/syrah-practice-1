import { BaseElement } from '@/base/BaseElement'
import { TemplateResult, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

const QUICKSHOP_EVENTS = {
  OPEN: 'quickshop::open',
}

@customElement('quick-shop-toggle')
export class QuickShop extends BaseElement {
  @property({ type: String, attribute: 'product-url' })
  productUrl!: string

  handleClick(event: Event) {
    event.preventDefault()
    this.$emit(QUICKSHOP_EVENTS.OPEN, this.productUrl + '?view=quick-shop')
  }

  render(): TemplateResult<1> {
    return html`<slot @click="${this.handleClick}"></slot>`
  }
}
