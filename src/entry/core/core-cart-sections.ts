import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import '@/components/cart-note'
import '@/components/cart-remove-toggle'
import '@/components/quantity-input'
import firstFocusableElement from '@/lib/firstFocusableElement'
import HTMLUpdateUtility from '@/mixins/HTMLUpdateUtility'
import { WithShopifyCartClientMixin } from '@/mixins/WithShopifyCart'
import { customElement, property } from 'lit/decorators.js'

@customElement('cart-sections')
export class CartSections extends WithShopifyCartClientMixin(
  BaseElementWithoutShadowDOM
) {
  static SECTIONS_CACHE: Record<string, string | null> = {}
  $htmlUpdateUtility: HTMLUpdateUtility = new HTMLUpdateUtility(this)

  @property({ type: String, attribute: 'section-id' })
  sectionId!: string

  lastFocusedElementSelectorId: string | null | undefined

  connectedCallback() {
    super.connectedCallback()

    this.$htmlUpdateUtility.addPostProcessCallback(() => {
      window?.Shopify?.PaymentButton?.init()

      if (this.lastFocusedElementSelectorId) {
        setTimeout(() => {
          const activeElement = document.querySelector(
            `#${this.lastFocusedElementSelectorId}`
          ) as HTMLElement
          if (activeElement) {
            activeElement?.focus()
          } else {
            firstFocusableElement(this)?.focus()
          }

          this.lastFocusedElementSelectorId = null
        }, 50)
      }
    })
  }

  protected updated(): void {
    if (
      !!this.cartSections[this.sectionId] &&
      JSON.stringify(this.cartSections[this.sectionId]) !==
        CartSections.SECTIONS_CACHE[this.sectionId]
    ) {
      CartSections.SECTIONS_CACHE[this.sectionId] = JSON.stringify(
        this.cartSections[this.sectionId]
      )
      const html = this.$htmlUpdateUtility.parseSectionStringForSelector(
        this.cartSections[this.sectionId] as string,
        `[section-id="${this.sectionId}"]`
      )
      html && this.$htmlUpdateUtility.replace(this, html)
    }
  }
}
