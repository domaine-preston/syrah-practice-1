import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import { LiveRegionUtility } from '@/mixins/LiveRegionUtility'
import { customElement } from 'lit/decorators.js'

@customElement('recipient-form')
export class RecipientForm extends BaseElementWithoutShadowDOM {
  $liveRegionUtility = new LiveRegionUtility(this)
  toggleCheckbox!: HTMLInputElement
  emailInput!: HTMLInputElement
  nameInput!: HTMLInputElement
  messageInput!: HTMLInputElement
  sendonInput!: HTMLInputElement
  offsetProperty!: HTMLInputElement

  constructor() {
    super()
    this.onChange = this.onChange.bind(this)
  }

  connectedCallback(): void {
    this.toggleCheckbox = this.querySelector(
      `#Recipient-checkbox-${this.dataset.sectionId}`
    ) as HTMLInputElement

    this.emailInput = this.querySelector(
      `#Recipient-email-${this.dataset.sectionId}`
    ) as HTMLInputElement

    this.nameInput = this.querySelector(
      `#Recipient-name-${this.dataset.sectionId}`
    ) as HTMLInputElement

    this.messageInput = this.querySelector(
      `#Recipient-message-${this.dataset.sectionId}`
    ) as HTMLInputElement

    this.sendonInput = this.querySelector(
      `#Recipient-send-on-${this.dataset.sectionId}`
    ) as HTMLInputElement

    this.offsetProperty = this.querySelector(
      `#Recipient-timezone-offset-${this.dataset.sectionId}`
    ) as HTMLInputElement

    this.toggleCheckbox.disabled = false
    this.toggleCheckbox.addEventListener('change', this.onChange.bind(this))

    this.offsetProperty &&
      (this.offsetProperty.value = new Date().getTimezoneOffset().toString())
  }

  onChange(): void {
    if (this.toggleCheckbox.checked) {
      this.enableInputFields()
      this.$liveRegionUtility.announce({
        message: 'Recipient form expanded. Fill in the fields to send a gift.',
      })
    } else {
      this.clearInputFields()
      this.disableInputFields()

      this.$liveRegionUtility.announce({
        message: 'Recipient form collapsed. Click the checkbox to expand.',
      })
    }
  }

  get inputFields() {
    return [
      this.emailInput,
      this.nameInput,
      this.messageInput,
      this.sendonInput,
    ]
  }

  enableInputFields(): void {
    this.disableableFields().forEach((field) => (field.disabled = false))
  }

  disableInputFields(): void {
    this.disableableFields().forEach((field) => (field.disabled = true))
  }

  disableableFields() {
    return [...this.inputFields, this.offsetProperty]
  }

  clearInputFields() {
    this.inputFields.forEach((field) => (field.value = ''))
  }

  resetRecipientForm() {
    if (this.toggleCheckbox.checked) {
      this.toggleCheckbox.checked = false
      this.clearInputFields()
    }
  }
}
