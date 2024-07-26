import BaseElement from '@/base/BaseElement'
import { WithShopifyCartClientMixin } from '@/mixins/WithShopifyCart'
import { html, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'

@customElement('product-form')
export class ProductForm extends WithShopifyCartClientMixin(BaseElement) {
  @state()
  error = null

  $errorMessage = createRef<HTMLElement>()

  async _handleFormSubmit(event: Event) {
    try {
      this.error = null
      event.preventDefault()
      const form = event.target as HTMLFormElement
      form && (await this.addItemToWithForm(new FormData(form)))
      this.openCartDrawer()
    } catch (error: any) {
      this.error = error.errrors || error.message || 'An error occurred'
      await this.updateComplete
      this.$errorMessage.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }

  get errorHTML() {
    if (this.error) {
      return html`<p
        class="body mt-sm p-2xs text-u-error ring-1 ring-u-error"
        ${ref(this.$errorMessage)}
      >
        ${this.error}
      </p>`
    }

    return nothing
  }

  render() {
    return html`
      <slot @submit=${this._handleFormSubmit}></slot>
      ${this.errorHTML}
    `
  }
}
