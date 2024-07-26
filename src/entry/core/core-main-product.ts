import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import '@/components/product-form'
import '@/components/quantity-input'
import '@/components/variant-picker'
import {
  VARIANT_PICKER_CHANGE_EVENT,
  type VariantPickerChangeEvent,
} from '@/components/variant-picker'
import HTMLUpdateUtility from '@/mixins/HTMLUpdateUtility'
import { customElement, property } from 'lit/decorators.js'

@customElement('main-product')
export class MainProduct extends BaseElementWithoutShadowDOM {
  $htmlUpdateUtility: HTMLUpdateUtility = new HTMLUpdateUtility(this)

  @property({ type: String, attribute: 'section-id' })
  sectionId!: string

  @property({ type: String, attribute: 'product-url' })
  productUrl!: string

  @property({ type: String, attribute: 'view' })
  view!: string

  @property({
    type: String,
    attribute: 'update-url',
    converter: (value) => value === 'true',
  })
  shouldUpdateUrl!: boolean

  connectedCallback(): void {
    super.connectedCallback()
    this.handleVariantPickerChange = this.handleVariantPickerChange.bind(this)
    this.addEventListener(
      VARIANT_PICKER_CHANGE_EVENT,
      this.handleVariantPickerChange as EventListener
    )

    this.$htmlUpdateUtility.addPostProcessCallback(() => {
      window?.Shopify?.PaymentButton?.init()
    })
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener(
      VARIANT_PICKER_CHANGE_EVENT,
      this.handleVariantPickerChange as EventListener
    )
  }

  private updateURL(url: string, variantId: string) {
    if (!this.shouldUpdateUrl) return
    window.history.replaceState(
      {},
      '',
      `${url}${variantId ? `?variant=${variantId}` : ''}`
    )
  }

  private handleVariantPickerChange(event: VariantPickerChangeEvent) {
    const newProductUrl = event.detail.productUrl
    const targetVariantId = event.detail.variantId

    if (!targetVariantId || targetVariantId.trim() === '') return
    this.updateURL(newProductUrl ?? '', targetVariantId)

    if (
      newProductUrl &&
      newProductUrl !== '' &&
      newProductUrl !== this.productUrl
    ) {
      this.productUrl = newProductUrl
    }

    this.$htmlUpdateUtility
      .fetchAndReplaceSectionId({
        renderRoot: this,
        sectionId: this.sectionId,
        baseUrl: newProductUrl ? newProductUrl : this.productUrl,
        params: {
          variant: targetVariantId,
          ...(this.view ? { view: this.view } : {}),
        },
        withCache: true,
      })
      .catch((error) => {
        if (error instanceof Error) {
          throw error
        } else {
          console.warn(error)
        }
      })
  }
}
