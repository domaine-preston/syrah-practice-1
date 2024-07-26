import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import { customElement } from 'lit/decorators.js'

export const VARIANT_PICKER_CHANGE_EVENT = 'variant-picker:change'
export type VariantPickerChangeEvent = CustomEvent<{
  event: Event
  target: EventTarget
  variantId?: string
  productUrl?: string
  selectedOptionValues: string[]
}>
@customElement('variant-picker')
export class VariantPicker extends BaseElementWithoutShadowDOM {
  connectedCallback(): void {
    super.connectedCallback()
    this._handleOptionChange = this._handleOptionChange.bind(this)
    this.addEventListener('change', this._handleOptionChange)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('change', this._handleOptionChange)
  }

  _handleOptionChange(event: Event): void {
    event.stopPropagation()
    const target = event.target as HTMLElement
    const dataTarget =
      target.tagName === 'SELECT'
        ? (target as HTMLSelectElement).selectedOptions[0]
        : target

    target &&
      this.$emit(VARIANT_PICKER_CHANGE_EVENT, {
        event,
        target: dataTarget,
        variantId: dataTarget.dataset.variantId,
        productUrl: dataTarget.dataset.productUrl,
        selectedOptionValues: this.selectedOptionValues,
      })
  }

  get selectedOptionValues() {
    return Array.from(
      this.querySelectorAll(
        'select, fieldset input:checked'
      ) as NodeListOf<HTMLElement>
    )
      .map(({ dataset }) => dataset.optionValueId)
      .filter(Boolean) as string[]
  }
}
