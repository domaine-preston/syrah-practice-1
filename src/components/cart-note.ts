import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import { ON_CHANGE_DEBOUNCE_TIMER, debounce } from '@/lib/debounce'
import { WithShopifyCartClientMixin } from '@/mixins/WithShopifyCart'
import { customElement } from 'lit/decorators.js'

@customElement('cart-note')
export class CartNote extends WithShopifyCartClientMixin(
  BaseElementWithoutShadowDOM
) {
  _handleInputDebounced: EventListener

  constructor() {
    super()
    this._handleInput = this._handleInput.bind(this)
    this._handleInputDebounced = debounce(
      this._handleInput,
      ON_CHANGE_DEBOUNCE_TIMER
    )
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('input', this._handleInputDebounced)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('input', this._handleInputDebounced)
  }

  _handleInput(event: Event) {
    const note = (event.target as HTMLInputElement).value
    this.updateCartNoteAndAttributes({ note }, { sections: false })
  }
}
